// Demo-Modus: alles wird nur im Browser gespeichert (localStorage).
// Gut zum Ausprobieren – andere Geräte sehen diese Daten nicht.
import type { Comment, DataApi, Order, Product, Rating, Video } from "./types";

export const DEMO_PASSWORD = "tpwe";

type Db = {
  products: Product[];
  videos: Video[];
  ratings: Rating[];
  comments: Comment[];
  orders: Order[];
};

const KEY = "tpwe-demo-db";
const ADMIN_KEY = "tpwe-demo-admin";

const now = () => new Date().toISOString();
const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function seed(): Db {
  const t = now();
  return {
    products: [
      {
        id: uid(),
        created_at: t,
        name: "Beispiel: Super-Lupe 3000",
        name_en: "Example: Super Magnifier 3000",
        name_ja: "れい：スーパールーペ3000",
        description: "Macht kleine Dinge riesengroß. (Das ist ein Beispiel – Noah kann es im Admin-Bereich löschen.)",
        description_en: "Makes tiny things huge. (This is an example – Noah can delete it in the admin area.)",
        description_ja: "小さいものを大きく見せるよ。（これはれいです。）",
        price: 5,
        emoji: "🔍",
        image_url: null,
        published: true,
      },
    ],
    videos: [],
    ratings: [],
    comments: [],
    orders: [],
  };
}

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {}
  const db = seed();
  save(db);
  return db;
}

function save(db: Db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    throw new Error("Speicher voll – Bild zu groß?");
  }
}

const byNewest = <T extends { created_at: string }>(a: T, b: T) =>
  b.created_at.localeCompare(a.created_at);

function upsert<T extends { id: string; created_at: string }>(list: T[], item: Partial<T>): T[] {
  if (item.id) return list.map((x) => (x.id === item.id ? { ...x, ...item } : x));
  return [...list, { ...item, id: uid(), created_at: now() } as T];
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function createLocalApi(): DataApi {
  return {
    mode: "demo",

    async listProducts(includeHidden) {
      return load().products.filter((p) => includeHidden || p.published).sort(byNewest);
    },
    async getProduct(id) {
      return load().products.find((p) => p.id === id) ?? null;
    },
    async saveProduct(p) {
      const db = load();
      db.products = upsert(db.products, p);
      save(db);
    },
    async deleteProduct(id) {
      const db = load();
      db.products = db.products.filter((p) => p.id !== id);
      save(db);
    },

    async listVideos(includeHidden) {
      return load().videos.filter((v) => includeHidden || v.published).sort(byNewest);
    },
    async saveVideo(v) {
      const db = load();
      db.videos = upsert(db.videos, v);
      save(db);
    },
    async deleteVideo(id) {
      const db = load();
      db.videos = db.videos.filter((v) => v.id !== id);
      save(db);
    },

    async uploadFile(file, folder) {
      if (folder === "videos") throw new Error("demo-video");
      if (file.size > 1_000_000) throw new Error("demo-image-size");
      return readAsDataUrl(file);
    },

    async listRatings() {
      return load().ratings;
    },
    async addRating(product_id, stars) {
      const db = load();
      db.ratings.push({ product_id, stars });
      save(db);
    },

    async listComments(target) {
      return load()
        .comments.filter((c) =>
          "product_id" in target ? c.product_id === target.product_id : c.video_id === target.video_id,
        )
        .filter((c) => c.approved)
        .sort(byNewest);
    },
    async listAllComments() {
      return load().comments.sort(byNewest);
    },
    async addComment(c) {
      const db = load();
      db.comments.push({ product_id: null, video_id: null, ...c, id: uid(), created_at: now(), approved: false });
      save(db);
    },
    async setCommentApproved(id, approved) {
      const db = load();
      db.comments = db.comments.map((c) => (c.id === id ? { ...c, approved } : c));
      save(db);
    },
    async deleteComment(id) {
      const db = load();
      db.comments = db.comments.filter((c) => c.id !== id);
      save(db);
    },

    async addOrder(o) {
      const db = load();
      db.orders.push({ ...o, id: uid(), created_at: now(), status: "neu" });
      save(db);
    },
    async listOrders() {
      return load().orders.sort(byNewest);
    },
    async setOrderStatus(id, status) {
      const db = load();
      db.orders = db.orders.map((o) => (o.id === id ? { ...o, status } : o));
      save(db);
    },
    async deleteOrder(id) {
      const db = load();
      db.orders = db.orders.filter((o) => o.id !== id);
      save(db);
    },

    async isAdmin() {
      return localStorage.getItem(ADMIN_KEY) === "1";
    },
    async login(_email, password) {
      if (password !== DEMO_PASSWORD) throw new Error("wrong-password");
      localStorage.setItem(ADMIN_KEY, "1");
    },
    async logout() {
      localStorage.removeItem(ADMIN_KEY);
    },
  };
}
