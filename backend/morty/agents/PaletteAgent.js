class PaletteAgent {
  constructor() {
    this.name = 'PaletteAgent';
    this.description = 'Demo agent that returns a palette';
  }

  async execute(context) {
    const base = (context && context.input && context.input.base) || 'primary';
    const palettes = {
      primary: ['red', 'green', 'blue'],
      neutral: ['#111', '#666', '#ccc']
    };

    return {
      agent: this.name,
      result: {
        base,
        colors: palettes[base] || palettes.primary
      }
    };
  }
}

module.exports = PaletteAgent;
