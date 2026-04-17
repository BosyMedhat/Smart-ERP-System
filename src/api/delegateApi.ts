import apiClient from './axiosConfig';

export const getRepresentatives = async () => {
    try {
        const response = await apiClient.get('representatives/');
        return response.data;
    } catch (error) {
        console.error("Error fetching representatives:", error);
        throw error;
    }
};

export const createRepresentative = async (data: any) => {
    try {
        const response = await apiClient.post('representatives/', data);
        return response.data;
    } catch (error) {
        console.error("Error creating representative:", error);
        throw error;
    }
};

export const updateRepresentative = async (id: string, data: any) => {
    try {
        const response = await apiClient.patch(`representatives/${id}/`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating representative:", error);
        throw error;
    }
};

export const deleteRepresentative = async (id: string) => {
    try {
        await apiClient.delete(`representatives/${id}/`);
        return true;
    } catch (error) {
        console.error("Error deleting representative:", error);
        throw error;
    }
};
