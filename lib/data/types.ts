export type Product = {
  id: string;
  created_at: string;
  name: string;
  name_en?: string | null;
  name_ja?: string | null;
  description: string;
  description_en?: string | null;
  description_ja?: string | null;
  price: number;
  emoji?: string | null;
  image_url?: string | null;
  published: boolean;
};

export type Video = {
  id: string;
  created_at: string;
  title: string;
  title_en?: string | null;
  title_ja?: string | null;
  description?: string | null;
  topic?: string | null;
  video_url?: string | null;
  youtube_url?: string | null;
  published: boolean;
};

export type Comment = {
  id: string;
  created_at: string;
  product_id?: string | null;
  video_id?: string | null;
  author_name: string;
  text: string;
  approved: boolean;
};

export type OrderStatus = "neu" | "in_arbeit" | "erledigt";

export type Order = {
  id: string;
  created_at: string;
  product_id: string;
  product_name: string;
  quantity: number;
  customer_name: string;
  contact: string;
  message?: string | null;
  status: OrderStatus;
};

export type Rating = { product_id: string; stars: number };

export type CommentTarget = { product_id: string } | { video_id: string };

export type NewComment = { author_name: string; text: string } & CommentTarget;

export type NewOrder = Omit<Order, "id" | "created_at" | "status">;

export type Profile = {
  id: string;
  created_at: string;
  email?: string | null;
  display_name: string;
  avatar: string;
  rocket_stars: number;
  quiz_best: number;
  blocked: boolean;
};

export type Membership = {
  user_id: string;
  paid_at: string;
  amount_cents: number;
  source: "stripe" | "admin";
};

export type Member = Profile & { membership: Membership | null };

export type SignUpResult = "ok" | "confirm-email";

export type GameName = "rocket" | "quiz";

export type LeaderRow = { display_name: string; avatar: string; points: number; is_me: boolean };

export type Challenge = {
  id: string;
  created_at: string;
  title: string;
  title_en?: string | null;
  title_ja?: string | null;
  prize?: string | null;
  game: GameName;
  starts_at: string;
  ends_at: string;
};

export type Reward = {
  id: string;
  created_at: string;
  title: string;
  title_en?: string | null;
  title_ja?: string | null;
  emoji: string;
  cost: number;
  active: boolean;
};

export type RedemptionStatus = "neu" | "erledigt" | "abgelehnt";

export type Redemption = {
  id: string;
  created_at: string;
  user_id: string;
  reward_id: string | null;
  reward_title: string;
  cost: number;
  status: RedemptionStatus;
};

export type BoardPost = {
  id: string;
  created_at: string;
  user_id: string;
  author_name: string;
  author_avatar: string;
  text: string;
  approved: boolean;
};

export type AiQuestion = { id: number; created_at: string; user_id: string; question: string; answer: string; lang: string };

export type ProfessorTurn = { question: string; answer: string };

export type CallStatus = "neu" | "bestaetigt" | "abgelehnt" | "erledigt";

export type CallRequest = {
  id: string;
  created_at: string;
  user_id: string;
  author_name: string;
  author_avatar: string;
  wish: string;
  message?: string | null;
  adult_present: boolean;
  status: CallStatus;
  scheduled_at: string | null;
};

export type CallJoin = { url: string; token: string; endsAt: string };

export interface DataApi {
  mode: "demo" | "online";

  listProducts(includeHidden?: boolean): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  saveProduct(p: Partial<Product>): Promise<void>;
  deleteProduct(id: string): Promise<void>;

  listVideos(includeHidden?: boolean): Promise<Video[]>;
  saveVideo(v: Partial<Video>): Promise<void>;
  deleteVideo(id: string): Promise<void>;

  uploadFile(file: File, folder: "images" | "videos"): Promise<string>;

  listRatings(): Promise<Rating[]>;
  addRating(productId: string, stars: number): Promise<void>;

  listComments(target: CommentTarget): Promise<Comment[]>;
  listAllComments(): Promise<Comment[]>;
  addComment(c: NewComment): Promise<void>;
  setCommentApproved(id: string, approved: boolean): Promise<void>;
  deleteComment(id: string): Promise<void>;

  addOrder(o: NewOrder): Promise<void>;
  listOrders(): Promise<Order[]>;
  setOrderStatus(id: string, status: OrderStatus): Promise<void>;
  deleteOrder(id: string): Promise<void>;

  // Konten & Erfinder-Ausweis
  signUp(email: string, password: string, displayName: string): Promise<SignUpResult>;
  getMyProfile(): Promise<Profile | null>;
  updateMyProfile(p: Partial<Pick<Profile, "display_name" | "avatar">>): Promise<void>;
  addRocketStars(n: number): Promise<void>;
  saveQuizScore(score: number): Promise<void>;

  // DELUXE
  getMyMembership(): Promise<Membership | null>;
  /** Startet die Bezahlung und liefert die Adresse der Bezahlseite. */
  startCheckout(lang: string): Promise<string>;
  /** Prüft nach der Rückkehr von der Bezahlseite, ob bezahlt wurde. */
  confirmCheckout(sessionId: string): Promise<boolean>;

  // DELUXE-Extras
  recordResult(game: GameName, points: number): Promise<void>;
  leaderboard(game: GameName, since?: string, until?: string): Promise<LeaderRow[]>;
  listChallenges(): Promise<Challenge[]>;
  saveChallenge(c: Partial<Challenge>): Promise<void>;
  deleteChallenge(id: string): Promise<void>;
  listRewards(includeInactive?: boolean): Promise<Reward[]>;
  saveReward(r: Partial<Reward>): Promise<void>;
  deleteReward(id: string): Promise<void>;
  talerBalance(): Promise<number>;
  redeemReward(id: string): Promise<void>;
  listRedemptions(): Promise<Redemption[]>;
  setRedemptionStatus(id: string, status: RedemptionStatus): Promise<void>;
  listBoardPosts(): Promise<BoardPost[]>;
  addBoardPost(text: string): Promise<void>;
  setBoardPostApproved(id: string, approved: boolean): Promise<void>;
  deleteBoardPost(id: string): Promise<void>;
  askProfessor(question: string, lang: string, history: ProfessorTurn[]): Promise<{ answer: string; remaining: number }>;
  listAiQuestions(): Promise<AiQuestion[]>;

  // Funkraum & Privat-Gespräche
  listCallRequests(): Promise<CallRequest[]>;
  addCallRequest(r: { wish: string; message: string | null; adult_present: boolean }): Promise<void>;
  updateCallRequest(id: string, patch: { status: CallStatus; scheduled_at?: string | null }): Promise<void>;
  deleteCallRequest(id: string): Promise<void>;
  /** Persönlicher Zutritt zum Video-Raum (nur zu den erlaubten Zeiten) */
  joinCall(kind: "group" | "private", lang: string, requestId?: string): Promise<CallJoin>;

  // Admin: Mitglieder
  listMembers(): Promise<Member[]>;
  adminSetMembership(userId: string, active: boolean): Promise<void>;
  adminSetBlocked(userId: string, blocked: boolean): Promise<void>;

  isAdmin(): Promise<boolean>;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}
