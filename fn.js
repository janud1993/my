(function() {
  'use strict';
  
  var fn = {};
  
  var r_time = /\[(\d{2}):(\d{2})\.(\d{2,3})]/g;
  var r_text = /^\s+|\s+$/g;
  
  var decode = function(text) {
    return Buffer.from(text, 'base64').toString('utf8');
  }
  
  fn.parseJSON = function(text, target) {
    var res;
    
    if(target === 'info') {
      
      text = text.replace('MusicInfoCallback(', '');
      text = text.replace(')', '');
      res = this.songInfo(text);
      
    } else if(target === 'lyric') {
      
      text = text.replace('MusicJsonCallback(', '');
      text = text.replace(')', '');
      text = JSON.parse(text);
      text = decode(text);
      text = text.replace('[999:00.00]***Lirik didapat dari pihak ketiga***', '');
      text = text.replace('[offset:0]', '');
      res = this.songLyric(text);
      
    } else {
      
      if(target) {
        text = text.replace('mutiara(', '');
        text = text.replace(')', '');
        text = JSON.parse(text);
        
        if (target === 'search') {
          res = this.searchSong(text);
        } else if (target === 'singer') {
          res = this.playList(text);
        }
      } else {
        text = JSON.parse(text);
        res = this.chartList(text);
      }
    }
    
    
    return res;
  }
  
  fn.songInfo = function(json) {
    var items = {};
    items.songid = json.encodedSongById;
    items.name = json.msong;
    items.singer = json.msinger;
    items.singerid = json.msingerid;
    items.singerlist = json.singer_list;
    items.album = json.malbum;
    items.albumid = json.malbumid;
    items.img = json.imgSrc;
    items.duration = json.minterval;
    items.public_time = json.public_time;
    items.mp3Url = json.r320Url;
    items.songUrl = [json.mp3Url, json.r192Url, json.r320Url];
    
    return items;
  }
  
  fn.songLyric = function(text) {
    var items = [];
    
    var lrc = text.split('\n');
    
    for(var i=0; i < lrc.length; i++) {
      if(lrc[i].match(r_time)) {
        items.push({
          time: lrc[i].match(r_time)[0],
          text: lrc[i].replace(r_time, '').replace(r_text, '')
        })
      }
    }
    
    return items;
  }
  
  fn.searchSong = function(json) {
    var items = {};
    items.songlist = [];
    
    var i = 0;
    var r = json.itemlist;
    
    for(; i < r.length; i++) {
      var y = r[i];
      var o = {};
      
      o.position = (i + 1);
      o.songid = y.songid;
      o.name = decode(y.info1);
      o.singer = decode(y.info2);
      o.singerid = y.singerid;
      o.singerlist = y.singer_list;
      o.album = decode(y.info3);
      o.albumid = y.albumid;
      o.duration = y.playtime;
      
      items.songlist.push(o);
    }
    
    items.page = this.page(json.sum);
    
    return items;
  }
  
  fn.playList = function(json) {
    
    var items = {};
    items.songlist = [];
    
    items.singer = decode(json.name);
    items.songnum = json.sum;
    items.img = json.pic;
    
    for(var i=0; i < json.songlist.length; i++) {
      var y = json.songlist[i];
      
      items.songlist.push({
        position: (i + 1),
        songid: y.songid,
        name: y.songname,
        singer: decode(y.singername),
        singerid: y.singerid,
        singerlist: y.singer_list,
        album: y.albumname,
        albumid: y.albumid,
        duration: y.playtime,
        mp3Url: y.url128
      });
      
    }
    
    items.page = this.page(json.sum);
    
    return items;
  }
  
  fn.chartList = function(json) {
    
    var items = {};
    items.songlist = [];
    items.total = json.total_count;
    items.show = json.list_count;
    items.next = json.next_index;
    
    for(var i=0; i < json.items.length; i++) {
      var y = json.items[i];
      
      items.songlist.push({
        position: (i + 1),
        songid: y.id,
        name: y.name,
        singerlist: y.artist_list,
        album: y.album_name,
        albumid: y.album_id,
        img: y.images[y.images.length -1],
        genre: y.genre,
        language: y.language,
        duration: y.play_duration
      });
    }
    
    return items;
  }
  
  fn.searchUrl = function(q, p, s, e) {
    
    p = p ? p : 1,
    s = s ? s : 0,
    e = e ? e : 29;
    
    q = q.replace(/ /, '+');
    
    return `http://api.joox.com/web-fcgi-bin//web_search?callback=mutiara&lang=id&country=id&type=0&search_input=${q}&pn=${p}&sin=${s}&ein=${e}`;
  }
  
  fn.infoUrl = function(id) {
    return `http://api.joox.com/web-fcgi-bin/web_get_songinfo?songid=${id}&lang=id&country=id&from_type=null&channel_id=null`;
  }
  
  fn.lyricUrl = function(id) {
    return `http://api.joox.com/web-fcgi-bin/web_lyric?musicid=${id}&lang=id&country=id`;
  }
  
  fn.singerUrl = function(id, s, e) {
    
    s = s ? s : 0;
    e = e ? e : 29;
    
    return `http://api.joox.com/web-fcgi-bin/web_album_singer?cmd=2&singerid=${id}&sin=${s}&ein=${e}&lang=id&country=id&callback=mutiara`;
  }
  
  fn.chartUrl = function(code, index, num) {
    code = code ? code : 33;
    index = index ? index : 0;
    num = num ? num : 50;
    
    return `http://api-jooxtt.sanook.com/openjoox/v1/toplist/${code}/tracks?country=id&lang=id&index=${index}&num=${num}`;
  }
  
  fn.page = function(index) {
    var sin = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270];
    var ein = [29, 59, 89, 119, 149, 179, 199, 199, 199, 199];
    
    var num = index >= 300 ? 10 : index >= 240 ? 9 : index >= 210 ? 8 : index >= 200 ? 7 : index >= 180 ? 6 : index >= 150 ? 5 : index >= 120 ? 4 : index >= 90 ? 3 : index >= 60 ? 2 : 1;
    
    var page = [];
    
    for(var i=0; i < num; i++) {
      page.push({
        pn: (i + 1),
        sin: sin[i],
        ein: ein[i],
        next: i == 0 ? false : true
      });
    }
    
    return page;
  }
  
  module.exports = fn;
})();
