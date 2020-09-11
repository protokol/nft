let mockBlock: any | null;

export const blockRepository = {
    getDelegatesForgedBlocks: async () => {
        return mockBlock ? [mockBlock] : [];
    },
    getLastForgedBlocks: async () => {
        return mockBlock ? [mockBlock] : [];
    },
};
