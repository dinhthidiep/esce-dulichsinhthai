import { API_BASE_URL } from '~/config/api';

// Dùng cùng domain với API deploy, các endpoint ở dưới đã tự thêm /api/tour/...
const backend_url = API_BASE_URL.replace('/api', '');

// Tour Combo APIs
export const createTourCombo = async (comboData) => {
  try {
    const response = await fetch(`${backend_url}/api/tour/create-tour-combo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(comboData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create tour combo");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Create tour combo failed:", error);
    throw error;
  }
};

export const getAllTourCombos = async () => {
  try {
    const response = await fetch(`${backend_url}/api/tour/tour-combos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch tour combos");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get tour combos failed:", error);
    throw error;
  }
};