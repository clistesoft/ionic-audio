import {IAudioTrack} from './ionic-audio-interfaces';
import {Component, ElementRef, Input} from '@angular/core';

@Component({
  selector: 'read-along',
  template: `
   <p #passage-text>{{audioTrack.content}}</p>
  `
})
export class AudioReadAlongComponent {
  autofocus_current_word:boolean = true;
  words:any[];
  _current_end_select_timeout_id = null;
  _current_next_select_timeout_id = null;
  /**
   * The AudioTrackComponent parent instance created by ```<audio-track>```
   *
   * @property @Input() audioTrack
   * @type {IAudioTrack}
   */
  @Input() audioTrack: IAudioTrack;

  constructor(private el: ElementRef) {
    console.log("read-along init");
    this.generateWordList();
    this.selectCurrentWord();
  }


  //generateWordList

  generateWordList(){
    let word_els = this.audioTrack.content.querySelectorAll('[data-begin]');
    this.words = Array.prototype.map.call(word_els, function (word_el, index) {
      let word = {
        'begin': parseFloat(word_el.dataset.begin),
        'dur': parseFloat(word_el.dataset.dur),
        'element': word_el,
        'index':index,
        'end':parseFloat(word_el.dataset.begin)+ parseFloat(word_el.dataset.dur)
      };
      word_el.tabIndex = 0; // to make it focusable/interactive
      word_el.dataset.index = word.index;

      console.log("word",word);
      return word;
    });
  };

  getCurrentWord(){
    let i;
    let len;
    let is_current_word;
    let word = null;

    for(i = 0, len = this.words.length; i < len; i += 1){
      is_current_word = (
        (
          this.audioTrack.duration >= this.words[i].begin
          &&
          this.audioTrack.duration < this.words[i].end
        )
        ||
        (this.audioTrack.duration < this.words[i].begin)
      );
      if (is_current_word) {
        word = this.words[i];
        break;
      }
    }
    if (!word) {
      throw Error('Unable to find current word and we should always be able to.');
    }
    return word;
  };

  selectCurrentWord(){
     let current_word = this.getCurrentWord();
     let is_playing = this.audioTrack.isPlaying;

     console.log("current word",current_word);

     if(!current_word.element.classList.contains('speaking')){
       this.removeWordSelection();
       current_word.element.classList.add('speaking');
       if (this.autofocus_current_word) {
         current_word.element.focus();
       }
     }

     if(is_playing){
       let next_word = this.words[current_word.index + 1];
       let seconds_until_this_word_ends = current_word.end - this.audioTrack.duration;

       clearTimeout(this._current_end_select_timeout_id);
       this._current_end_select_timeout_id = setTimeout(
         function () {
           if (!this.audioTrack.isPlaying) { // we always want to have a word selected while paused
             current_word.element.classList.remove('speaking');
           }
         },
         Math.max(seconds_until_this_word_ends * 1000, 0)
       );
       if(next_word){
         let seconds_until_next_word_begins = next_word.begin - this.audioTrack.duration;
         clearTimeout(this._current_next_select_timeout_id);
         this._current_next_select_timeout_id = setTimeout(
           function () {
             this.selectCurrentWord();
           },
           Math.max(seconds_until_next_word_begins * 1000, 0)
         );
       }
     }
  };

  removeWordSelection() {
     let spoken_word_els = this.audioTrack.content.querySelectorAll('span[data-begin].speaking');
     Array.prototype.forEach.call(spoken_word_els, function (spoken_word_el) {
     spoken_word_el.classList.remove('speaking');
  });
}

}
