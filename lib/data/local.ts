// Demo-Modus: alles wird nur im Browser gespeichert (localStorage).
// Gut zum Ausprobieren – andere Geräte sehen diese Daten nicht.
import type {
  AiQuestion,
  BoardPost,
  CallRequest,
  Challenge,
  Comment,
  DataApi,
  GameName,
  LeaderRow,
  Member,
  Membership,
  Order,
  Product,
  Profile,
  Rating,
  Redemption,
  Reward,
  Video,
} from "./types";

export const DEMO_PASSWORD = "tpwe";

type DemoUser = Profile & { password: string };

type Db = {
  products: Product[];
  videos: Video[];
  ratings: Rating[];
  comments: Comment[];
  orders: Order[];
  users?: DemoUser[];
  memberships?: Membership[];
  results?: { user_id: string; game: GameName; points: number; created_at: string }[];
  challenges?: Challenge[];
  rewards?: Reward[];
  redemptions?: Redemption[];
  posts?: BoardPost[];
  aiQuestions?: AiQuestion[];
  calls?: CallRequest[];
};

const DEMO_REWARDS: Omit<Reward, "id" | "created_at">[] = [
  { title: "TPWE-Sticker", title_en: "TPWE sticker", title_ja: "TPWEステッカー", emoji: "🏷️", cost: 20, active: true },
  { title: "Gruß von Noah im nächsten Video", title_en: "Shout-out in Noah's next video", title_ja: "次の動画でノアからあいさつ", emoji: "🎬", cost: 60, active: true },
  { title: "Noah erfindet etwas für dich", title_en: "Noah invents something for you", title_ja: "ノアがきみのために発明する", emoji: "💡", cost: 100, active: true },
];

const KEY = "tpwe-demo-db";
const ADMIN_KEY = "tpwe-demo-admin";
const USER_KEY = "tpwe-demo-user";

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

function currentUser(db: Db): DemoUser | null {
  const id = localStorage.getItem(USER_KEY);
  return db.users?.find((u) => u.id === id) ?? null;
}

const toProfile = ({ password: _p, ...profile }: DemoUser): Profile => profile;

function isMember(db: Db, me: DemoUser | null) {
  return !!me && !me.blocked && !!db.memberships?.some((m) => m.user_id === me.id);
}

function balance(db: Db, userId: string) {
  const earned = (db.results ?? []).filter((r) => r.user_id === userId).reduce((s, r) => s + r.points, 0);
  const spent = (db.redemptions ?? [])
    .filter((r) => r.user_id === userId && r.status !== "abgelehnt")
    .reduce((s, r) => s + r.cost, 0);
  return earned - spent;
}

export function createLocalApi(): DataApi {
  const isAdminLocal = () => localStorage.getItem(ADMIN_KEY) === "1";
  const updateMe = (patch: Partial<Profile>) => {
    const db = load();
    const me = currentUser(db);
    if (!me) throw new Error("not-logged-in");
    db.users = db.users!.map((u) => (u.id === me.id ? { ...u, ...patch } : u));
    save(db);
  };

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

    async signUp(email, password, displayName) {
      const db = load();
      db.users ??= [];
      if (db.users.some((u) => u.email?.toLowerCase() === email.toLowerCase())) throw new Error("already-registered");
      const user: DemoUser = {
        id: uid(),
        created_at: now(),
        email,
        password,
        display_name: displayName.slice(0, 30) || "Erfinder",
        avatar: "🧑‍🔬",
        rocket_stars: 0,
        quiz_best: 0,
        blocked: false,
      };
      db.users.push(user);
      save(db);
      localStorage.setItem(USER_KEY, user.id);
      return "ok";
    },
    async getMyProfile() {
      const me = currentUser(load());
      return me ? toProfile(me) : null;
    },
    async updateMyProfile(p) {
      updateMe(p);
    },
    async addRocketStars(n) {
      const me = currentUser(load());
      if (me && n > 0) updateMe({ rocket_stars: me.rocket_stars + n });
    },
    async saveQuizScore(score) {
      const me = currentUser(load());
      if (me && score > me.quiz_best) updateMe({ quiz_best: score });
    },

    async getMyMembership() {
      const db = load();
      const me = currentUser(db);
      return (me && db.memberships?.find((m) => m.user_id === me.id)) || null;
    },
    async startCheckout() {
      // Demo: Bezahlung wird nur simuliert
      const db = load();
      const me = currentUser(db);
      if (!me) throw new Error("not-logged-in");
      db.memberships ??= [];
      if (!db.memberships.some((m) => m.user_id === me.id))
        db.memberships.push({ user_id: me.id, paid_at: now(), amount_cents: 1050, source: "stripe" });
      save(db);
      return "/deluxe?session_id=demo";
    },
    async confirmCheckout() {
      return !!(await this.getMyMembership());
    },

    async recordResult(game, points) {
      const db = load();
      const me = currentUser(db);
      if (!me || points <= 0) return;
      (db.results ??= []).push({ user_id: me.id, game, points, created_at: now() });
      save(db);
    },
    async leaderboard(game, since, until) {
      const db = load();
      const me = currentUser(db);
      if (!isMember(db, me) && !isAdminLocal()) return [];
      const totals = new Map<string, number>();
      for (const r of db.results ?? []) {
        if (r.game !== game || (since && r.created_at < since) || (until && r.created_at >= until)) continue;
        totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + r.points);
      }
      return [...totals]
        .map(([id, points]): LeaderRow | null => {
          const u = db.users?.find((x) => x.id === id);
          if (!u || u.blocked || !db.memberships?.some((m) => m.user_id === id)) return null;
          return { display_name: u.display_name, avatar: u.avatar, points, is_me: id === me?.id };
        })
        .filter((r): r is LeaderRow => !!r && r.points > 0)
        .sort((a, b) => b.points - a.points)
        .slice(0, 20);
    },
    async listChallenges() {
      const db = load();
      if (!isMember(db, currentUser(db)) && !isAdminLocal()) return [];
      return [...(db.challenges ?? [])].sort((a, b) => b.starts_at.localeCompare(a.starts_at));
    },
    async saveChallenge(c) {
      const db = load();
      db.challenges = upsert(db.challenges ?? [], c);
      save(db);
    },
    async deleteChallenge(id) {
      const db = load();
      db.challenges = (db.challenges ?? []).filter((c) => c.id !== id);
      save(db);
    },
    async listRewards(includeInactive) {
      const db = load();
      if (!db.rewards) {
        db.rewards = DEMO_REWARDS.map((r) => ({ ...r, id: uid(), created_at: now() }));
        save(db);
      }
      return db.rewards.filter((r) => includeInactive || r.active).sort((a, b) => a.cost - b.cost);
    },
    async saveReward(r) {
      const db = load();
      db.rewards = upsert(db.rewards ?? [], r);
      save(db);
    },
    async deleteReward(id) {
      const db = load();
      db.rewards = (db.rewards ?? []).filter((r) => r.id !== id);
      save(db);
    },
    async talerBalance() {
      const db = load();
      const me = currentUser(db);
      return me ? balance(db, me.id) : 0;
    },
    async redeemReward(id) {
      const db = load();
      const me = currentUser(db);
      if (!me || !isMember(db, me)) throw new Error("not-member");
      const reward = db.rewards?.find((r) => r.id === id && r.active);
      if (!reward) throw new Error("not-found");
      if (balance(db, me.id) < reward.cost) throw new Error("not-enough-taler");
      (db.redemptions ??= []).push({
        id: uid(), created_at: now(), user_id: me.id, reward_id: reward.id, reward_title: reward.title, cost: reward.cost, status: "neu",
      });
      save(db);
    },
    async listRedemptions() {
      const db = load();
      const me = currentUser(db);
      return (db.redemptions ?? []).filter((r) => isAdminLocal() || r.user_id === me?.id).sort(byNewest);
    },
    async setRedemptionStatus(id, status) {
      const db = load();
      db.redemptions = (db.redemptions ?? []).map((r) => (r.id === id ? { ...r, status } : r));
      save(db);
    },
    async listBoardPosts() {
      const db = load();
      const me = currentUser(db);
      const member = isMember(db, me);
      return (db.posts ?? [])
        .filter((p) => isAdminLocal() || p.user_id === me?.id || (p.approved && member))
        .sort(byNewest);
    },
    async addBoardPost(text) {
      const db = load();
      const me = currentUser(db);
      if (!me || !isMember(db, me)) throw new Error("not-member");
      (db.posts ??= []).push({
        id: uid(), created_at: now(), user_id: me.id, author_name: me.display_name, author_avatar: me.avatar, text: text.slice(0, 300), approved: false,
      });
      save(db);
    },
    async setBoardPostApproved(id, approved) {
      const db = load();
      db.posts = (db.posts ?? []).map((p) => (p.id === id ? { ...p, approved } : p));
      save(db);
    },
    async deleteBoardPost(id) {
      const db = load();
      db.posts = (db.posts ?? []).filter((p) => p.id !== id);
      save(db);
    },
    async askProfessor(question, lang) {
      const answers: Record<string, string> = {
        de: "🧪 Demo-Modus: Ich bin noch nicht an mein Erfinder-Gehirn angeschlossen. Sobald die App online ist und einen KI-Schlüssel hat, beantworte ich deine Frage richtig!",
        en: "🧪 Demo mode: I'm not connected to my inventor brain yet. Once the app is online with an AI key, I'll answer properly!",
        ja: "🧪 デモモード：まだ発明家の頭脳につながっていないよ。オンラインになったら、ちゃんと答えるね！",
      };
      const db = load();
      const me = currentUser(db);
      const answer = answers[lang] ?? answers.de;
      if (me) (db.aiQuestions ??= []).push({ id: Date.now(), created_at: now(), user_id: me.id, question, answer, lang });
      save(db);
      return { answer, remaining: 20 };
    },
    async listAiQuestions() {
      return [...(load().aiQuestions ?? [])].sort(byNewest);
    },

    async listCallRequests() {
      const db = load();
      const me = currentUser(db);
      return (db.calls ?? []).filter((c) => isAdminLocal() || c.user_id === me?.id).sort(byNewest);
    },
    async addCallRequest(r) {
      const db = load();
      const me = currentUser(db);
      if (!me || !isMember(db, me)) throw new Error("not-member");
      if (!r.adult_present) throw new Error("adult-required");
      const open = (db.calls ?? []).filter((c) => c.user_id === me.id && (c.status === "neu" || c.status === "bestaetigt"));
      if (open.length >= 2) throw new Error("too-many-requests");
      (db.calls ??= []).push({
        ...r, id: uid(), created_at: now(), user_id: me.id, author_name: me.display_name, author_avatar: me.avatar, status: "neu", scheduled_at: null,
      });
      save(db);
    },
    async updateCallRequest(id, patch) {
      const db = load();
      db.calls = (db.calls ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c));
      save(db);
    },
    async deleteCallRequest(id) {
      const db = load();
      db.calls = (db.calls ?? []).filter((c) => c.id !== id);
      save(db);
    },
    async joinCall() {
      throw new Error("demo-video");
    },

    async listMembers() {
      const db = load();
      return (db.users ?? [])
        .map((u): Member => ({ ...toProfile(u), membership: db.memberships?.find((m) => m.user_id === u.id) ?? null }))
        .sort(byNewest);
    },
    async adminSetMembership(userId, active) {
      const db = load();
      db.memberships = (db.memberships ?? []).filter((m) => m.user_id !== userId);
      if (active) db.memberships.push({ user_id: userId, paid_at: now(), amount_cents: 0, source: "admin" });
      save(db);
    },
    async adminSetBlocked(userId, blocked) {
      const db = load();
      db.users = (db.users ?? []).map((u) => (u.id === userId ? { ...u, blocked } : u));
      save(db);
    },

    async isAdmin() {
      return localStorage.getItem(ADMIN_KEY) === "1";
    },
    async login(email, password) {
      const db = load();
      const user = db.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase() && u.password === password);
      if (user) {
        localStorage.setItem(USER_KEY, user.id);
        return;
      }
      if (password !== DEMO_PASSWORD) throw new Error("wrong-password");
      localStorage.setItem(ADMIN_KEY, "1");
    },
    async logout() {
      localStorage.removeItem(ADMIN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  };
}
