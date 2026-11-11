export type SellerApplicationStatus = "pending" | "approved" | "rejected";

export interface SellerApplication {
  id: string;
  userId: string;
  email: string;
  username: string;
  storeName: string;
  storeSlug: string;
  phone: string;
  country: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  payoutMethod: "bank" | "paypal";
  payoutAccount: string;
  idDocumentName?: string;
  status: SellerApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}
