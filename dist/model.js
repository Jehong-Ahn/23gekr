class Entity extends Object {
  constructor(data) {
    super(); 
    if (data) Object.assign(this, data);
  }
  required(keys) {
    for (const key of keys) {
      if (!(key in this)) {
        throw new Error(`No ${key} for ${this.constructor.name} instance.`);
      }
    }
  }
  compact(keys) { 
    return keys.reduce((acc, key) => { acc[key] = this[key]; return acc; }, {});
  }
}
class List extends Object {
  constructor(data) { super(); if (data) Object.assign(this, data); }
  size() { return Object.keys(this).length; }
}



// TODO: 타이틀 삭제
// TODO: 신규 챕터 추가
// TODO: 마지막 챕터 정보 추가
class Title extends Entity {
  constructor(data={}) {

    // JSON으로부터 받은 데이터는 챕터를 객체로 변환
    if (data && data.chapters) data.chapters = data.chapters.map(o => {
      if (o instanceof Chapter) return o;
      return new Chapter(Object.assign({ titleId: data.id }, o));
    });

    super( Object.assign({ name: "", author: "", touched: 0, chapters: [] }, data) );

    this.required(["id", "name", "author", "touched", "chapters"]);
  }
  saveToLocal() {
    return localStorage.set(this.id, this.compact(["name", "author", "touched"]));
  }
  toJSON() {
    return this.compact(["id", "name", "author", "touched", "chapters"]);
  }
  addToSession() {
    let titleList;
    if (titleList = TitleList.fromSession()) {
      titleList[this.id] = this;
      titleList.saveToSession();
    }
  }
  delete() {
    delete localStorage[this.id];
    let titleList;
    if (titleList = TitleList.fromSession()) {
      delete titleList[this.id];
      titleList.saveToSession();
    }
  }
}

class TitleList extends List {
  constructor(data={}) {
    super();
    for (const [id, val] of Object.entries(data)) {
      if (!(val instanceof Title)) this[id] = new Title( Object.assign({ id }, val) );
      else this[id] = val;
    }
  }
  toSortedArr() {
    return Object.values(this).sort((a,b) => (b.touched||0) - (a.touched||0));
  }
  saveToSession() {
    sessionStorage.set("titles", this);
  }
}

/**
 * LocalStorage로부터 TitleList를 생성하여 반환.
 */
TitleList.fromLocal = function () {
  const titleList = Object.entries(localStorage)
  // 타이틀정보가 챕터정보 앞에 오도록 정렬
  .sort((a,b) => a[0].length - b[0].length)
  // 타이틀/챕터 정보가 아닌 정보를 제외
  .filter(([key]) => key[0]!=="_")
  .reduce((acc, [key,val]) => {  
    // 타이틀id의 경우
    if ( ! key.includes("|") ) {
      acc[key] = new Title( Object.assign( { id: key }, JSON.parse(val)) );
    }
    // 타이틀id와 챕터코드의 pair인 경우
    else {
      const [titleId, code] = key.split("|");
      if ( ! acc[titleId] ) return acc; // 타이틀 정보가 없으면 스킵
      acc[titleId].chapters.push( new Chapter( Object.assign( { titleId, code }, JSON.parse(val) ) ) );
    }
    return acc;
  }, new TitleList());

  // 타이틀마다 챕터 정렬
  Object.values(titleList).forEach(o => {
    o.chapters.sort((a,b) => b.no.toString().localeCompare(a.no.toString()));
  });

  return titleList;
};

/**
 * 리모트로부터 LocalStorage를 업데이트하고, 업데이트된 TitleList를 반환.
 */
TitleList.fromLocalAndSync = function () {
  return Promise.allSettled([
    fetch("https://atkg.cafe24.com/23gekr_files/titles.tsv")
      .then(res=>res.text())
      .then(text=>text.split("\n").slice(1).map(line=>line.split("\t"))),
    new Promise(rs=>rs(TitleList.fromLocal()))
  ])
  .then(([remote, local]) => {
    // 로컬 실패 시 안내
    if (local.status!=='fulfilled') { alert("브라우저 오류. 브라우저를 다시 시작해주세요."); return []; }

    // 리모트 실패 시, 로컬만 사용
    if (remote.status!=='fulfilled') return local.value;
    
    // 리모트, 로컬 문제 없으면, 리모트로부터 씽크하고 정렬하여 리턴.
    remote.value.forEach(row => {
      var id = row[0];
      var title = local.value[id];
      if ( title && ( title.name !== row[1] || title.author !== row[2] || title.channels !== row[3] ) ) {
        title.name = row[1];
        title.author = row[2];
        title.channels = row[3];
        title.saveToLocal();
      }
    });
    return local.value;
  });
}

TitleList.fromSession = function () {
  return "titles" in sessionStorage ? new TitleList(sessionStorage.get("titles")) : null;
}

TitleList.init = function () {
  const titleList = TitleList.fromSession();
  if (titleList) return new Promise(rs => rs(titleList));
  else {
    return TitleList.fromLocalAndSync().then(titleList => {
      titleList.saveToSession();
      return titleList;
    });
  }
}


class Chapter extends Entity {
  constructor(data={}) {
    super(data);
    this.required(["titleId", "code", "no", "name"]);
  }
  saveToLocal() {
    return localStorage.set(this.titleId + "|" + this.code, this.compact(["no", "name"]));
  }
  toJSON() {
    return this.compact(["code", "no", "name"]);
  }
  removeFromLocalAndSession() {
    delete localStorage[this.titleId+ "|"+this.code];

    let cache, title, index;
    if ( ( cache = sessionStorage.get("titles") ) 
      && ( title = cache[this.titleId] ) 
      && ( index = title.chapters.findIndex(o=>o.code===this.code) ) !== -1
    ) {
      title.chapters.splice(index, 1);
      sessionStorage.set("titles", cache);
    }
  }
}
Chapter.fromLocal = function (titleId, code) {
  const data = localStorage.get(titleId + "|" + code);
  return data ? new Chapter(Object.assign({titleId, code}, data)) : null;
}

if (module) module.exports = { Entity, List, Title, TitleList, Chapter };