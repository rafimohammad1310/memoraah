export type Promotion = {
    id: string;
    code: string;
    discountValue: number;
    type: "percentage" | "fixed";
    startDate: Date;
    endDate: Date;
    usageLimit: number | null;
    usageCount: number;
    status: "active" | "inactive";
    minOrderAmount?: number;
    appliesTo?: string[];
  };