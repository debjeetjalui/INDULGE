
const API_BASE_URL = 'http://localhost:5001/api';

export const api3d = {
    async getGarments() {
        const response = await fetch(`${API_BASE_URL}/garments`);
        if (!response.ok) throw new Error('Failed to fetch garments');
        return response.json();
    },

    async getGarment(id) {
        const response = await fetch(`${API_BASE_URL}/garments/${id}`);
        if (!response.ok) throw new Error('Failed to fetch garment');
        return response.json();
    },

    async get3DFabrics() {
        const response = await fetch(`${API_BASE_URL}/3d-fabrics`);
        if (!response.ok) throw new Error('Failed to fetch fabrics');
        return response.json();
    },

    async get3DFabric(id) {
        const response = await fetch(`${API_BASE_URL}/3d-fabrics/${id}`);
        if (!response.ok) throw new Error('Failed to fetch fabric');
        return response.json();
    },

    async healthCheck() {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.json();
    },

    getAssetBaseUrl() {
        return 'http://localhost:5001';
    }
};

export default api3d;
