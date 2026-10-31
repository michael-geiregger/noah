// Online-Modus: alle Daten liegen in Supabase und sind auf jedem Gerät gleich.
import { createClient } from "@supabase/supabase-js";
import type {
  AiQuestion,
  BoardPost,
  CallJoin,
  CallRequest,
  Challenge,
  Comment,
  DataApi,
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

const BUCKET = "media";

export function createSupabaseApi(url: string, anonKey: string): DataApi {
  const sb = createClient(url, anonKey);

  const check = <T>({ data, error }: { data: T; error: { message: string } | null }): T => {
    if (error) throw new Error(error.message);
    return data;
  };

  const me = async () => (await sb.auth.getSession()).data.session;

  /** Verbindung abgebrochen (z. B. Safari "Load failed") statt echter Antwort vom Server? */
  const isNetworkError = (e: { name?: string; status?: number } | null) =>
    !!e && e.name === "AuthRetryableFetchError" && !e.status;

  /** Ist der Supabase-Server überhaupt erreichbar? (pausiertes Projekt, falsche Adresse …) */
  const networkErrorKind = async () => {
    try {
      const res = await fetch(`${url}/auth/v1/health`, { headers: { apikey: anonKey }, cache: "no-store" });
      return res.ok ? "network" : "server-unreachable";
    } catch {
      return "server-unreachable";
    }
  };

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /** Ruft eine Server-Funktion der App auf (mit dem Anmelde-Ausweis). */
  const callApi = async <T>(path: string, body: unknown): Promise<T> => {
    const session = await me();
    if (!session) throw new Error("not-logged-in");
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `http-${res.status}`);
    return json as T;
  };

  return {
    mode: "online",

    async listProducts(includeHidden) {
      let q = sb.from("products").select("*").order("created_at", { ascending: false });
      if (!includeHidden) q = q.eq("published", true);
      return check(await q) as Product[];
    },
    async getProduct(id) {
      return check(await sb.from("products").select("*").eq("id", id).maybeSingle()) as Product | null;
    },
    async saveProduct(p) {
      const { id, created_at: _c, ...rest } = p;
      if (id) check(await sb.from("products").update(rest).eq("id", id));
      else check(await sb.from("products").insert(rest));
    },
    async deleteProduct(id) {
      check(await sb.from("products").delete().eq("id", id));
    },

    async listVideos(includeHidden) {
      let q = sb.from("videos").select("*").order("created_at", { ascending: false });
      if (!includeHidden) q = q.eq("published", true);
      return check(await q) as Video[];
    },
    async saveVideo(v) {
      const { id, created_at: _c, ...rest } = v;
      if (id) check(await sb.from("videos").update(rest).eq("id", id));
      else check(await sb.from("videos").insert(rest));
    },
    async deleteVideo(id) {
      check(await sb.from("videos").delete().eq("id", id));
    },

    async uploadFile(file, folder) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      check(await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type }));
      return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    },

    async listRatings() {
      return check(await sb.from("ratings").select("product_id, stars")) as Rating[];
    },
    async addRating(product_id, stars) {
      check(await sb.from("ratings").insert({ product_id, stars }));
    },

    async listComments(target) {
      const [col, val] = "product_id" in target ? ["product_id", target.product_id] : ["video_id", target.video_id];
      return check(
        await sb.from("comments").select("*").eq(col, val).eq("approved", true).order("created_at", { ascending: false }),
      ) as Comment[];
    },
    async listAllComments() {
      return check(await sb.from("comments").select("*").order("created_at", { ascending: false })) as Comment[];
    },
    async addComment(c) {
      check(await sb.from("comments").insert({ ...c, approved: false }));
    },
    async setCommentApproved(id, approved) {
      check(await sb.from("comments").update({ approved }).eq("id", id));
    },
    async deleteComment(id) {
      check(await sb.from("comments").delete().eq("id", id));
    },

    async addOrder(o) {
      check(await sb.from("orders").insert({ ...o, status: "neu" }));
    },
    async listOrders() {
      return check(await sb.from("orders").select("*").order("created_at", { ascending: false })) as Order[];
    },
    async setOrderStatus(id, status) {
      check(await sb.from("orders").update({ status }).eq("id", id));
    },
    async deleteOrder(id) {
      check(await sb.from("orders").delete().eq("id", id));
    },

    async signUp(email, password, displayName) {
      for (let attempt = 1; ; attempt++) {
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (!error) return data.session ? "ok" : "confirm-email";
        if (!isNetworkError(error)) throw new Error(error.message.includes("already") ? "already-registered" : error.message);

        // Verbindung abgebrochen: Wurde das Konto trotzdem angelegt? Dann einfach anmelden.
        await wait(1500);
        const login = await sb.auth.signInWithPassword({ email, password });
        if (!login.error) return "ok";
        if (/not confirmed/i.test(login.error.message)) return "confirm-email";
        if (attempt >= 2 || isNetworkError(login.error)) throw new Error(await networkErrorKind());
        // Konto gibt es noch nicht → ein zweiter Versuch
      }
    },
    async getMyProfile() {
      const session = await me();
      if (!session) return null;
      return check(await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle()) as Profile | null;
    },
    async updateMyProfile(p) {
      const session = await me();
      if (!session) throw new Error("not-logged-in");
      check(await sb.from("profiles").update(p).eq("id", session.user.id));
    },
    async addRocketStars(n) {
      const profile = await this.getMyProfile();
      if (!profile || n <= 0) return;
      check(await sb.from("profiles").update({ rocket_stars: profile.rocket_stars + n }).eq("id", profile.id));
    },
    async saveQuizScore(score) {
      const profile = await this.getMyProfile();
      if (!profile || score <= profile.quiz_best) return;
      check(await sb.from("profiles").update({ quiz_best: score }).eq("id", profile.id));
    },

    async getMyMembership() {
      const session = await me();
      if (!session) return null;
      return check(
        await sb.from("memberships").select("user_id, paid_at, amount_cents, source").eq("user_id", session.user.id).maybeSingle(),
      ) as Membership | null;
    },
    async startCheckout(lang) {
      const { url } = await callApi<{ url: string }>("/api/checkout", { lang });
      return url;
    },
    async confirmCheckout(sessionId) {
      const { member } = await callApi<{ member: boolean }>("/api/checkout/confirm", { sessionId });
      return member;
    },

    async recordResult(game, points) {
      if (!(await me()) || points <= 0) return;
      check(await sb.from("game_results").insert({ game, points }));
    },
    async leaderboard(game, since, until) {
      const rows = check(
        await sb.rpc("leaderboard", { p_game: game, p_since: since ?? "-infinity", p_until: until ?? "infinity" }),
      ) as LeaderRow[];
      return rows.map((r) => ({ ...r, points: Number(r.points) }));
    },
    async listChallenges() {
      return check(await sb.from("challenges").select("*").order("starts_at", { ascending: false })) as Challenge[];
    },
    async saveChallenge(c) {
      const { id, created_at: _c, ...rest } = c;
      if (id) check(await sb.from("challenges").update(rest).eq("id", id));
      else check(await sb.from("challenges").insert(rest));
    },
    async deleteChallenge(id) {
      check(await sb.from("challenges").delete().eq("id", id));
    },
    async listRewards(includeInactive) {
      let q = sb.from("rewards").select("*").order("cost");
      if (!includeInactive) q = q.eq("active", true);
      return check(await q) as Reward[];
    },
    async saveReward(r) {
      const { id, created_at: _c, ...rest } = r;
      if (id) check(await sb.from("rewards").update(rest).eq("id", id));
      else check(await sb.from("rewards").insert(rest));
    },
    async deleteReward(id) {
      check(await sb.from("rewards").delete().eq("id", id));
    },
    async talerBalance() {
      if (!(await me())) return 0;
      return Number(check(await sb.rpc("taler_balance")) ?? 0);
    },
    async redeemReward(id) {
      const { error } = await sb.rpc("redeem_reward", { p_reward: id });
      if (error) throw new Error(error.message.includes("not-enough-taler") ? "not-enough-taler" : error.message);
    },
    async listRedemptions() {
      return check(await sb.from("redemptions").select("*").order("created_at", { ascending: false })) as Redemption[];
    },
    async setRedemptionStatus(id, status) {
      check(await sb.from("redemptions").update({ status }).eq("id", id));
    },
    async listBoardPosts() {
      return check(await sb.from("board_posts").select("*").order("created_at", { ascending: false }).limit(200)) as BoardPost[];
    },
    async addBoardPost(text) {
      const { error } = await sb.from("board_posts").insert({ text });
      if (error) throw new Error(error.message.includes("too-many-posts") ? "too-many-posts" : error.message);
    },
    async setBoardPostApproved(id, approved) {
      check(await sb.from("board_posts").update({ approved }).eq("id", id));
    },
    async deleteBoardPost(id) {
      check(await sb.from("board_posts").delete().eq("id", id));
    },
    async askProfessor(question, lang, history) {
      return callApi<{ answer: string; remaining: number }>("/api/professor", { question, lang, history });
    },
    async listAiQuestions() {
      return check(await sb.from("ai_questions").select("*").order("created_at", { ascending: false }).limit(200)) as AiQuestion[];
    },

    async listCallRequests() {
      return check(await sb.from("call_requests").select("*").order("created_at", { ascending: false })) as CallRequest[];
    },
    async addCallRequest(r) {
      const { error } = await sb.from("call_requests").insert(r);
      if (error) throw new Error(error.message.includes("too-many-requests") ? "too-many-requests" : error.message);
    },
    async updateCallRequest(id, patch) {
      check(await sb.from("call_requests").update(patch).eq("id", id));
    },
    async deleteCallRequest(id) {
      check(await sb.from("call_requests").delete().eq("id", id));
    },
    async joinCall(kind, lang, requestId) {
      return callApi<CallJoin>("/api/funkraum", { kind, lang, requestId });
    },

    async listMembers() {
      const [profiles, memberships] = await Promise.all([
        sb.from("profiles").select("*").order("created_at", { ascending: false }),
        sb.from("memberships").select("user_id, paid_at, amount_cents, source"),
      ]);
      const byUser = new Map((check(memberships) as Membership[]).map((m) => [m.user_id, m]));
      return (check(profiles) as Profile[]).map((p): Member => ({ ...p, membership: byUser.get(p.id) ?? null }));
    },
    async adminSetMembership(userId, active) {
      check(await sb.rpc("admin_set_membership", { target: userId, active }));
    },
    async adminSetBlocked(userId, blocked) {
      check(await sb.rpc("admin_set_blocked", { target: userId, value: blocked }));
    },

    async isAdmin() {
      const { data } = await sb.auth.getSession();
      if (!data.session) return false;
      const { data: ok } = await sb.rpc("is_admin");
      return ok === true;
    },
    async login(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error && isNetworkError(error)) throw new Error(await networkErrorKind());
      if (error) throw new Error(/not confirmed/i.test(error.message) ? "confirm-email" : "wrong-password");
    },
    async logout() {
      await sb.auth.signOut();
    },
  };
}
