let NexusPromise = typeof window !== 'undefined' ? import('nexusui') : null;

export class GridSequencer {
  constructor(target, { rows = 4, columns = 8 } = {}) {
    this.rows = rows;
    this.columns = columns;
    this.sequencer = null;
    if (target && NexusPromise) {
      NexusPromise.then(({ default: Nexus }) => {
        this.sequencer = new Nexus.Sequencer(target, { rows, columns });
      }).catch(() => {
        /* ignore load errors */
      });
    }
  }
}
