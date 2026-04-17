import apiClient from './axiosConfig';

export const getDashboardStats = async () => {
    try {
        const response = await apiClient.get('dashboard/stats/');
        return response.data;
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
    }
};

export const getSalesChartData = async () => {
    try {
        const response = await apiClient.get('dashboard/sales_chart/');
        return response.data;
    } catch (error) {
        console.error("Error fetching chart data:", error);
        throw error;
    }
};

export const getRecentActivities = async () => {
    try {
        const response = await apiClient.get('dashboard/recent_activities/');
        return response.data;
    } catch (error) {
        console.error("Error fetching recent activities:", error);
        throw error;
    }
};
