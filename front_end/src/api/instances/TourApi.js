// Dùng HTTPS khớp với back_end
const backend_url = "https://localhost:7267";

// Tour APIs
export const createTour = async (tourData) => {
  try {
    const response = await fetch(`${backend_url}/api/tour/create-tour`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tourData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create tour");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Create tour failed:", error);
    throw error;
  }
};

export const getAllTours = async () => {
  try {
    const response = await fetch(`${backend_url}/api/tour/tours`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch tours");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Get tours failed:", error);
    throw error;
  }
};