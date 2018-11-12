import videojs from 'video.js';

const Plugin = videojs.getPlugin('plugin');

// Default options for the plugin.
const defaults = {
  startTime: 0
};

class Dvrseekbar extends Plugin {
  constructor (player, options) {
    super(player);

    this.btnLiveEl = null;
    this.oldSeekBar = null;

    this.options = videojs.mergeOptions(defaults, options);

    this.player.ready(() => {
      this.player.addClass('vjs-dvrseekbar');
      this.player.controlBar.addClass('vjs-dvrseekbar-control-bar');

      if (this.player.controlBar.progressControl) {
        this.player.controlBar.progressControl.addClass('vjs-dvrseekbar-progress-control');
      }

      // ADD Live Button:
      let btnLiveEl = document.createElement('div');
      this.newLink = document.createElement('button');

      btnLiveEl.className = 'vjs-live-button vjs-control';

      this.newLink.innerHTML = document.getElementsByClassName('vjs-live-display')[0].innerHTML;
      this.newLink.id = 'liveButton';

      if (!player.paused()) {
        this.newLink.className = 'vjs-live-label onair';
      }


      let clickHandler = function(e) {
        player.currentTime(player.seekable().end(0));

        player.play();
      };

      if (this.newLink.addEventListener) { // DOM method
        this.newLink.addEventListener('click', clickHandler, false);
      } else if (this.newLink.attachEvent) { // this is for IE, because it doesn't support addEventListener
        this.newLink.attachEvent('onclick', function() { return clickHandler.apply(newLink, [ window.event ]); });
      }

      btnLiveEl.appendChild(this.newLink);

      let controlBar = document.getElementsByClassName('vjs-control-bar')[0],
      insertBeforeNode = document.getElementsByClassName('vjs-progress-control')[0];

      controlBar.insertBefore(btnLiveEl, insertBeforeNode);

      videojs.log('dvrSeekbar Plugin ENABLED!');
    });

    this.setSeekBar();
    this.init();
  }

  init() {
    this.player.on('timeupdate', (e) => {
      this.onTimeUpdate(this, e);
    });

    this.player.on('play', (e) => {});

    this.player.on('pause', (e) => {
      let btnLiveEl = document.getElementById('liveButton');

      btnLiveEl.className = 'vjs-live-label';
    });
  }

  setSeekBar() {
    this.oldSeekBar = videojs.getComponent('SeekBar');
    const SeekBar = videojs.getComponent('SeekBar');

    SeekBar.prototype.dvrTotalTime = function(player) {
      let time = player.seekable();

      return  time && time.length ? time.end(0) - time.start(0) : 0;
    };

    SeekBar.prototype.handleMouseMove = function (e) {
      let bufferedTime, newTime;

      bufferedTime = newTime = this.player_.seekable();

      if (bufferedTime && bufferedTime.length) {
        for (newTime = bufferedTime.start(0) + this.calculateDistance(e) * this.dvrTotalTime(this.player_); newTime >= bufferedTime.end(0);)
          newTime -= .1;

        this.player_.currentTime(newTime);
      }
    };

    SeekBar.prototype.updateAriaAttributes = function () {
        let a, c, d = this.player_.seekable();

        d && d.length && (a = this.player_.scrubbing ? this.player_.getCache().currentTime : this.player_.currentTime(),
        c = d.end(0) - a, c = 0 > c ? 0 : c,
        this.el_.setAttribute('aria-valuenow',
          Math.round(100 * this.getPercent(), 2)),
        this.el_.setAttribute('aria-valuetext',
          (0 === a ? "" : "-") + videojs.formatTime(c, d.end(0))));
    };
  }

  onTimeUpdate() {
    let time = this.player.seekable();
    let btnLiveEl = document.getElementById('liveButton');

    // When any tech is disposed videojs will trigger a 'timeupdate' event when calling stopTrackingCurrentTime()
    // If the tech does not have a seekable() method, time will be undefined
    if (!time || !time.length) {
      return;
    }

    if (time.end(0) - this.player.currentTime() < 30) {
      btnLiveEl.className = 'vjs-live-label onair';
    } else {
      btnLiveEl.className = 'vjs-live-label';
    }

    this.player.duration(this.player.seekable().end(0));
  };

  dispose() {
    this.player.removeClass('vjs-dvrseekbar');
    this.player.controlBar.removeClass('vjs-dvrseekbar-control-bar');
    if (this.player.controlBar.progressControl) {
      this.player.controlBar.progressControl.removeClass('vjs-dvrseekbar-progress-control');
    }

    Array.from(document.getElementsByClassName('vjs-live-button'))
    .forEach(element => element.remove());

    this.player.off('timeupdate');
    super.dispose();
    videojs.log('the advanced plugin is being disposed');
  }

}
// Register the plugin with video.js.
videojs.registerPlugin('dvrseekbar', Dvrseekbar);

// Include the version number.
Dvrseekbar.VERSION = '__VERSION__';

export default Dvrseekbar;
