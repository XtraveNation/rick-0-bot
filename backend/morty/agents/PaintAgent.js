class PaintAgent {
  constructor() {
    this.name = 'PaintAgent';
    this.description = 'Demo agent that paints strokes';
  }

  async execute(context) {
    // Simple demo behaviour: echo input and produce a paint result
    const { input } = context || {};
    const color = (input && input.color) || 'blue';
    const strokes = (input && input.strokes) || 3;

    return {
      agent: this.name,
      result: {
        color,
        strokes,
        note: `Painted ${strokes} strokes in ${color}`
      }
    };
  }
}

module.exports = PaintAgent;
