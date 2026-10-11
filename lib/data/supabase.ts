// Online-Modus: alle Daten liegen in Supabase und sind auf jedem Gerät gleich.
import { createClient } from "@supabase/supabase-js";
import type { Comment, DataApi, Order, Product, Rating, Video } from "./types";

const BUCKET = "media";

export function createSupabaseApi(url: string, anonKey: string): DataApi {
  const sb = createClient(url, anonKey);

  const check = <T>({ data, error }: { data: T; error: { message: string } | null }): T => {
    if (error) throw new Error(error.message);
    return data;
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

    async isAdmin() {
      const { data } = await sb.auth.getSession();
      if (!data.session) return false;
      const { data: ok } = await sb.rpc("is_admin");
      return ok === true;
    },
    async login(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error("wrong-password");
    },
    async logout() {
      await sb.auth.signOut();
    },
  };
}
