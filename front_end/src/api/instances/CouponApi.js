// Dùng HTTPS khớp với back_end
const backend_url = "https://localhost:7267";

// Coupon APIs
export const createCoupon = async (couponData) => {
  try {
    const response = await fetch(`${backend_url}/api/tour/create-coupon`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(couponData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create coupon");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Create coupon failed:", error);
    throw error;
  }
};

export const getAllCoupons = async () => {
  try {
    const response = await fetch(`${backend_url}/api/tour/coupons`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch coupons");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get coupons failed:", error);
    throw error;
  }
};