module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/'],
      startServerCommand: 'bun run start',
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
