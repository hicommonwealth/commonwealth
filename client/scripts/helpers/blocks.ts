import app from 'state';
import { default as moment } from 'moment-twitter';
import m from 'mithril';
/*
 * blocknum helpers
 */

export function blocknumToTime(blocknum : number): moment.Moment {
  const currentBlocknum = app.chain.block.height;
  const blocktime = app.chain.block.duration;
  const lastBlockTime: moment.Moment = app.chain.block.lastTime.clone();
  return lastBlockTime.add((blocknum - currentBlocknum) * blocktime, 'seconds');
}

export function blocknumToDuration(blocknum : number) {
  return moment.duration(blocknumToTime(blocknum).diff(moment()));
}

export function blockperiodToDuration(blocknum : number) {
  return moment.duration(blocknum * app.chain.block.duration, 'seconds');
}

export class BlocktimeHelper {
  private _durations = [];
  private _durationwindow;
  private _previousblocktime: moment.Moment;
  private _lastblocktime;
  private _blocktime;

  constructor(durationwindow: number = 5) {
    this._durationwindow = durationwindow;
  }

  get lastblocktime() {
    return this._lastblocktime;
  }

  get blocktime() {
    return this._blocktime;
  }

  public stamp(timestamp: moment.Moment) {
    this._previousblocktime = this._lastblocktime;
    this._lastblocktime = timestamp;
    if (!this._previousblocktime) {
      return;
    }

    // apply moving average to figure out blocktimes
    const lastblockduration = moment.duration(timestamp.diff(this._previousblocktime)).asSeconds();
    this._durations.push(lastblockduration);
    if (this._durations.length > this._durationwindow) {
      this._durations.shift();
    }
    const durations = this._durations.slice();
    durations.sort();

    // take the median duration
    const newblocktime = Math.round(durations[Math.floor(durations.length / 2)]);
    if (newblocktime > 0 && newblocktime !== this._blocktime) {
      this._blocktime = newblocktime;
      console.log('blocktime: ' + this._blocktime);
      m.redraw();
    }
  }
}
