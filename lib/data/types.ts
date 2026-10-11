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

  isAdmin(): Promise<boolean>;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}
