import "dotenv/config";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";
import { AuditAction, PrismaClient, UserRole } from "@prisma/client";
import { RedisStore } from "connect-redis";
import express, { type NextFunction, type Request, type Response } from "express";
import session from "express-session";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { createClient } from "redis";
import { createServer as createViteServer } from "vite";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
void __dirname;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const prisma = new PrismaClient();
const redisClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });

const APP_URL = process.env.APP_URL ?? "";
const isHttps = APP_URL.startsWith("https");
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const CHAT_HISTORY_LIMIT = 20;

declare module "express-session" {
  interface SessionData {
    userId?: string;
    csrfToken?: string;
  }
}

type AppUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80),
  password: z.string().min(8).max(128),
  role: z.enum(["admin", "viewer"]).default("viewer"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(40),
  newPassword: z.string().min(8).max(128),
});

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
});

const jsonError = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ error: { code, message } });

const stripUser = (user: AppUser) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
});

const chatHistoryKey = (userId: string) => `chat:history:${userId}`;

const generateSecureToken = () => crypto.randomBytes(32).toString("hex");
const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

async function writeAuditLog(input: {
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  target?: string;
  meta?: Record<string, unknown> | null;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      userEmail: input.userEmail,
      action: input.action,
      target: input.target,
      meta: (input.meta ?? undefined) as any,
    },
  });
}

async function loadChatHistory(userId: string) {
  const payload = await redisClient.get(chatHistoryKey(userId));
  if (!payload) return [];
  try {
    const parsed = JSON.parse(typeof payload === "string" ? payload : payload.toString());
    if (Array.isArray(parsed)) return parsed as Array<{ role: "user" | "assistant"; content: string }>;
    return [];
  } catch {
    return [];
  }
}

async function saveChatHistory(userId: string, history: Array<{ role: "user" | "assistant"; content: string }>) {
  const trimmed = history.slice(-CHAT_HISTORY_LIMIT);
  await redisClient.set(chatHistoryKey(userId), JSON.stringify(trimmed), { EX: SESSION_TTL_SECONDS });
}

async function startServer() {
  await redisClient.connect();
  await prisma.$connect();

  const app = express();
  const PORT = 3000;
  const sessionSecret = process.env.SESSION_SECRET || "replace-me-in-production";

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    pinoHttp({
      genReqId: (req) => (req.headers["x-request-id"] as string) || crypto.randomUUID(),
      customSuccessMessage: (req) => `${req.method} ${req.url} completed`,
    }),
  );
  app.use(
    helmet({
      contentSecurityPolicy: false,
      hsts: false,
    }),
  );
  app.use(
    cors({
      credentials: true,
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (APP_URL && origin === APP_URL) return cb(null, true);
        if (!APP_URL && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
        return cb(new Error("Origin not allowed"));
      },
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(
    session({
      name: "sid",
      store: new RedisStore({ client: redisClient as any, prefix: "sess:" }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        sameSite: isHttps ? "none" : "lax",
        secure: isHttps,
        maxAge: SESSION_TTL_SECONDS * 1000,
      },
    }),
  );

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMITED", message: "Too many requests, try again later." } },
  });

  const csrfGuard = (req: Request, res: Response, next: NextFunction) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
    if (req.path === "/api/login" || req.path === "/api/forgot-password" || req.path === "/api/reset-password")
      return next();
    if (!req.session.userId) return next();
    const headerToken = req.header("x-csrf-token");
    if (!headerToken || !req.session.csrfToken || headerToken !== req.session.csrfToken) {
      return jsonError(res, 403, "CSRF_INVALID", "Invalid CSRF token.");
    }
    return next();
  };

  const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.session.userId;
    if (!userId) return jsonError(res, 401, "UNAUTHORIZED", "Please log in first.");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return jsonError(res, 401, "UNAUTHORIZED", "Session expired, please log in again.");
    (req as any).user = user;
    next();
  };

  const authorize = (role: UserRole) => (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AppUser | undefined;
    if (!user || user.role !== role) return jsonError(res, 403, "FORBIDDEN", "Admin access required.");
    next();
  };

  app.use(csrfGuard);

  app.get("/api/health", async (_req, res) => {
    try {
      const dbOk = await prisma.$queryRaw`SELECT 1`.catch(() => null);
      const redisOk = await redisClient.ping().catch(() => null);
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        dependencies: { postgres: !!dbOk, redis: redisOk === "PONG" },
      });
    } catch {
      res.status(503).json({ status: "error", message: "Health check failed" });
    }
  });

  app.post("/api/login", authLimiter, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return jsonError(res, 400, "VALIDATION_ERROR", "Invalid email or password format.");
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return jsonError(res, 401, "INVALID_CREDENTIALS", "Invalid credentials.");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return jsonError(res, 401, "INVALID_CREDENTIALS", "Invalid credentials.");

    req.session.userId = user.id;
    req.session.csrfToken = crypto.randomBytes(24).toString("hex");
    await writeAuditLog({ userId: user.id, userEmail: user.email, action: AuditAction.LOGIN });
    res.json({ user: stripUser(user), csrfToken: req.session.csrfToken });
  });

  app.post("/api/forgot-password", authLimiter, async (req, res) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) return jsonError(res, 400, "VALIDATION_ERROR", "Invalid email.");
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) return res.json({ status: "success", message: "If the account exists, reset instructions were generated." });

    const token = generateSecureToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 20);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });
    await writeAuditLog({ userId: user.id, userEmail: user.email, action: AuditAction.PASSWORD_RESET_REQUEST });

    const resetUrl = `${APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    res.json({
      status: "success",
      message: "Password reset token generated.",
      resetToken: token,
      resetUrl,
    });
  });

  app.post("/api/reset-password", authLimiter, async (req, res) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return jsonError(res, 400, "VALIDATION_ERROR", "Invalid reset payload.");
    const tokenHash = hashToken(parsed.data.token);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return jsonError(res, 400, "TOKEN_INVALID", "Invalid or expired reset token.");
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });
    await prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    const user = await prisma.user.findUnique({ where: { id: record.userId } });
    await writeAuditLog({
      userId: record.userId,
      userEmail: user?.email,
      action: AuditAction.PASSWORD_RESET_COMPLETE,
    });
    res.json({ status: "success", message: "Password updated successfully." });
  });

  app.post("/api/logout", authenticate, async (req, res) => {
    const user = (req as any).user as AppUser;
    const userId = req.session.userId;
    req.session.destroy(async () => {
      if (userId) await redisClient.del(chatHistoryKey(userId));
      res.clearCookie("sid");
      await writeAuditLog({ userId: user.id, userEmail: user.email, action: AuditAction.LOGOUT });
      res.json({ status: "success" });
    });
  });

  app.get("/api/me", authenticate, async (req, res) => {
    const user = (req as any).user as AppUser;
    if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(24).toString("hex");
    res.json({ user: stripUser(user), csrfToken: req.session.csrfToken });
  });

  app.post("/api/users", authenticate, authorize(UserRole.admin), async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) return jsonError(res, 400, "VALIDATION_ERROR", "Invalid user payload.");
    const { email, name, password, role } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return jsonError(res, 409, "USER_EXISTS", "User with this email already exists.");
    const passwordHash = await bcrypt.hash(password, 12);
    const created = await prisma.user.create({
      data: { email, name, passwordHash, role: role === "admin" ? UserRole.admin : UserRole.viewer },
    });
    await writeAuditLog({
      userId: (req as any).user.id,
      userEmail: (req as any).user.email,
      action: AuditAction.INGEST,
      target: created.email,
      meta: { event: "admin_created_user", role: created.role },
    });
    res.json({ user: stripUser(created) });
  });

  app.get("/api/dashboard-data", authenticate, async (_req, res) => {
    const [inventory, shipments, forecasts, alerts] = await Promise.all([
      prisma.inventoryItem.findMany({ orderBy: { sku: "asc" } }),
      prisma.shipment.findMany({ orderBy: { externalId: "asc" } }),
      prisma.forecastPoint.findMany({ orderBy: { date: "asc" } }),
      prisma.supplyAlert.findMany({ orderBy: { createdAt: "desc" } }),
    ]);
    res.json({
      inventory: inventory.map((i) => ({
        sku: i.sku,
        currentStock: i.currentStock,
        reorderPoint: i.reorderPoint,
        predictedStockoutDays: i.predictedStockoutDays,
        status: i.status,
        warehouse: i.warehouse,
      })),
      shipments: shipments.map((s) => ({
        id: s.externalId,
        sku: s.sku,
        origin: s.origin,
        destination: s.destination,
        status: s.status,
        eta: s.eta,
        quantity: s.quantity,
      })),
      forecast: forecasts.map((f) => ({ date: f.date, actual: f.actual, predicted: f.predicted })),
      alerts: alerts.map((a) => ({
        id: a.id,
        type: a.type,
        message: a.message,
        timestamp: a.timestamp,
        severity: a.severity,
      })),
    });
  });

  app.get("/api/audit-logs", authenticate, authorize(UserRole.admin), async (_req, res) => {
    const logs = await prisma.auditLog.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      select: { id: true, userEmail: true, action: true, target: true, meta: true, createdAt: true },
    });
    res.json({ logs });
  });

  app.post("/api/ingest", authenticate, authorize(UserRole.admin), async (req, res) => {
    const user = (req as any).user as AppUser;
    await writeAuditLog({ userId: user.id, userEmail: user.email, action: AuditAction.INGEST });
    res.json({ status: "success", message: "Shipment and Inventory data ingested into S3 Raw Zone", timestamp: new Date().toISOString() });
  });

  app.post("/api/run-etl", authenticate, authorize(UserRole.admin), async (req, res) => {
    const user = (req as any).user as AppUser;
    await writeAuditLog({ userId: user.id, userEmail: user.email, action: AuditAction.RUN_ETL });
    res.json({ status: "success", message: "Glue ETL Job 'SupplyChainETL' started.", jobRunId: `jr_${Math.random().toString(36).slice(2, 11)}` });
  });

  app.post("/api/run-inference", authenticate, authorize(UserRole.admin), async (req, res) => {
    const user = (req as any).user as AppUser;
    await writeAuditLog({ userId: user.id, userEmail: user.email, action: AuditAction.RUN_INFERENCE });
    res.json({ status: "success", message: "SageMaker inference job triggered.", predictionCount: 15 });
  });

  const toolDefinitions = [
    {
      name: "get_inventory_status",
      description: "Get current inventory stock levels.",
      parameters: { type: Type.OBJECT, properties: { status_filter: { type: Type.STRING, enum: ["ALL", "CRITICAL", "WARNING", "OPTIMAL"] } } },
    },
    {
      name: "get_shipments",
      description: "Get shipment tracking data.",
      parameters: { type: Type.OBJECT, properties: { status_filter: { type: Type.STRING, enum: ["ALL", "IN_TRANSIT", "DELAYED", "DELIVERED"] } } },
    },
    {
      name: "get_forecast",
      description: "Get demand forecast data.",
      parameters: { type: Type.OBJECT, properties: {} },
    },
    {
      name: "get_alerts",
      description: "Get current system alerts.",
      parameters: { type: Type.OBJECT, properties: { severity_filter: { type: Type.STRING, enum: ["ALL", "HIGH", "MEDIUM", "LOW"] } } },
    },
    {
      name: "trigger_restock",
      description: "Trigger emergency restock order (admin only).",
      parameters: {
        type: Type.OBJECT,
        properties: { sku: { type: Type.STRING }, quantity: { type: Type.NUMBER } },
        required: ["sku"],
      },
    },
  ];

  app.post("/api/chat", authenticate, async (req, res) => {
    try {
      const parsed = chatSchema.safeParse(req.body);
      if (!parsed.success) {
        console.error("Chat Validation Error:", parsed.error);
        return jsonError(res, 400, "VALIDATION_ERROR", "Message is required.");
      }
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        console.error("Chat Error: Gemini API key not configured correctly.");
        return jsonError(res, 500, "GEMINI_KEY_MISSING", "Gemini API key not configured.");
      }

      console.log(`Chat Request received. API Key exists (prefix: ${apiKey.slice(0, 8)}...)`);

      const user = (req as any).user as AppUser;
      const history = await loadChatHistory(user.id);
      const contents: any[] = history.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));
      contents.push({ role: "user", parts: [{ text: parsed.data.message }] });

      let response = await ai.models.generateContent({
        model: "gemini-1.5-flash-latest",
        contents,
        config: {
          systemInstruction:
            "You are an AI Supply Chain Copilot. Use tools for operational data and stay concise.",
          tools: [{ functionDeclarations: toolDefinitions }],
        },
      });

      let maxIterations = 5;
      while (maxIterations > 0) {
        const parts = response.candidates?.[0]?.content?.parts || [];
        const calls = parts.filter((p: any) => p.functionCall);
        if (calls.length === 0) break;

        const toolResults: any[] = [];
        for (const part of calls) {
          const name = part.functionCall.name as string;
          const args = (part.functionCall.args || {}) as Record<string, any>;
          let result: Record<string, unknown> = {};

          if (name === "get_inventory_status") {
            const status = args.status_filter;
            const data = await prisma.inventoryItem.findMany();
            const filtered = status && status !== "ALL" ? data.filter((d) => d.status === status) : data;
            result = { inventoryItems: filtered, totalItems: filtered.length };
          } else if (name === "get_shipments") {
            const status = args.status_filter;
            const data = await prisma.shipment.findMany();
            const filtered = status && status !== "ALL" ? data.filter((d) => d.status === status) : data;
            result = {
              shipments: filtered.map((d) => ({ id: d.externalId, sku: d.sku, origin: d.origin, destination: d.destination, status: d.status, eta: d.eta, quantity: d.quantity })),
              totalShipments: filtered.length,
            };
          } else if (name === "get_forecast") {
            const data = await prisma.forecastPoint.findMany({ orderBy: { date: "asc" } });
            result = { forecastData: data, model: "Prophet (Time Series)", confidence: "92%" };
          } else if (name === "get_alerts") {
            const severity = args.severity_filter;
            const data = await prisma.supplyAlert.findMany({ orderBy: { createdAt: "desc" } });
            const filtered = severity && severity !== "ALL" ? data.filter((d) => d.severity === severity) : data;
            result = { alerts: filtered, totalAlerts: filtered.length };
          } else if (name === "trigger_restock") {
            if (user.role !== UserRole.admin) result = { error: "Forbidden for current role." };
            else {
              const sku = String(args.sku || "");
              const item = await prisma.inventoryItem.findUnique({ where: { sku } });
              if (!item) result = { success: false, error: `SKU ${sku} not found` };
              else {
                await writeAuditLog({
                  userId: user.id,
                  userEmail: user.email,
                  action: AuditAction.RESTOCK_TRIGGER,
                  target: sku,
                  meta: { quantity: args.quantity || 500 },
                });
                result = {
                  success: true,
                  orderId: `RO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
                  sku,
                  quantity: args.quantity || 500,
                  warehouse: item.warehouse,
                  estimatedDelivery: "2-3 business days",
                };
              }
            }
          } else {
            result = { error: `Unknown tool: ${name}` };
          }

          await writeAuditLog({
            userId: user.id,
            userEmail: user.email,
            action: AuditAction.AI_TOOL_CALL,
            target: name,
            meta: { args },
          });
          toolResults.push({ functionResponse: { name, response: result } });
        }

        response = await ai.models.generateContent({
          model: "gemini-1.5-flash-latest",
          contents: [...contents, { role: "model", parts }, { role: "user", parts: toolResults }],
          config: {
            systemInstruction: "You are an AI Supply Chain Copilot. Use tools for operational data and stay concise.",
            tools: [{ functionDeclarations: toolDefinitions }],
          },
        });
        maxIterations--;
      }

      const finalText =
        response.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("") ||
        "I could not generate a response. Please try again.";
      await saveChatHistory(user.id, [...history, { role: "user", content: parsed.data.message }, { role: "assistant", content: finalText }]);
      await writeAuditLog({ userId: user.id, userEmail: user.email, action: AuditAction.AI_CHAT });
      res.json({ reply: finalText });
    } catch (error: any) {
      req.log.error({ error }, "chat_failed");
      return jsonError(res, 500, "CHAT_ERROR", "AI Copilot encountered an error.");
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`HTTPS mode: ${isHttps} | Cookie sameSite: ${isHttps ? "none" : "lax"}`);
  });
}

startServer().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
