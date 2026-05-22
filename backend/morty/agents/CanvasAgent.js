class CanvasAgent {
  constructor() {
    this.name = 'CanvasAgent';
    this.description = 'Demo agent that manages a canvas';
  }

  async execute(context) {
    const { input } = context || {};
    const width = (input && input.width) || 800;
    const height = (input && input.height) || 600;

    return {
      agent: this.name,
      result: {
        width,
        height,
        layers: []
      }
    };
  }
}

module.exports = CanvasAgent;
