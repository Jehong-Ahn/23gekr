HTMLElement.prototype.qs = HTMLElement.prototype.querySelector;
HTMLElement.prototype.qsa = HTMLElement.prototype.querySelectorAll;

HTMLElement.prototype.first = function() { return this.firstElementChild; };
HTMLElement.prototype.last = function() { return this.lastElementChild; };
HTMLElement.prototype.prev = function() { return this.previousElementSibling; };
HTMLElement.prototype.next = function() { return this.nextElementSibling; };

HTMLElement.prototype.toggle = function() { this.hidden = !this.hidden; };

HTMLElement.prototype.dispatch = function(eventName, detail) {
  if (!detail) this.dispatchEvent(new Event(eventName));
  else this.dispatchEvent(new CustomEvent(eventName, { detail }));
};
HTMLElement.prototype.once = function(eventName, handler) {
  this.addEventListener(eventName, handler, {once: true});
}
export function debounce(handler, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => handler(...args), wait);
  };
}


export function ce(tag='div', data={}) {

  // css, fonts 주소를 바로 입력받았을 때
  if (typeof tag==='string' && tag.slice(0,4)==='http') return ce('link', { href: tag, rel: 'stylesheet' });

  const tagMatch = typeof tag==='string' ? tag.match(/^\w+/) : '';
  const tagName = tagMatch ? tagMatch[0] : 'div';
  const el = document.createElement(tagName);
  
  if (typeof tag==='object') { data = tag; tag = 'div'; }
  else if (typeof data==='function') { data(el); data = {}; }
  else if (typeof data==='string') { 
    const temp = data;
    data = {};
    if (temp.trim()[0]==='<') data.html = temp;
    else data.text = temp;
  }

  let match;
  if (match = tag.match(/(?<=#)\w+/)) data.id = match[0];
  if (match = tag.match(/(?<=\.)[\w-]+/g)) {
    if (!data.class) data.class = '';
    data.class += (data.class ? ' ' : '') + match.join(' ');
  }

  Object.entries(data).forEach(([k,v]) => {
    // aliases
    if (k==='class') el.classList = v;
    else if (k==='text') el.textContent = v;
    else if (k==='html') el.innerHTML = v;
    // Data attributes (use camelCase)
    else if (k==='data') {
      Object.entries(v).forEach(([dk,dv]) => el.dataset[dk] = dv);
    }
    // 단순 할당이 불가한 built-in attrs
    else if (['for'].includes(k)) el.setAttribute(k, v);
    // 이외에는 단순 할당
    // onchange, onclick 등의 콜백도 단순 할당한다.
    else el[k] = v;
  });

  return el;
}
HTMLElement.prototype.ac = function() { return this.appendChild(ce(...arguments)); };




export function animateParticles({ canvas, count, Particle }) {
  const ctx = canvas.getContext('2d');

  Particle.prototype.draw = function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    ctx.fill();
  };

  let skipFrame = false;
  function animate() {
    if (!skipFrame) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(particle => {
            particle.update(canvas);
            particle.draw();
        });
      } 
      requestAnimationFrame(animate);
      // skipFrame = !skipFrame;
  }

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const particles = Array.from({length: count}, () => new Particle(canvas));

  animate();
}



String.prototype.matchSafe = function(regex) {
  const match = this.match(regex);
  return match ? ( match[1] || match[0] ) : '';
}


Storage.prototype.get = function (key) {
  var val = this[key]; 
  return val && ( val[0]==="{" || val[0]==="[" ) ? JSON.parse(val) : val; 
};
Storage.prototype.set = function (key, data) { 
  this[key] = typeof data === 'object' ? JSON.stringify(data) : data.toString(); 
  return this; 
}
Storage.prototype.getOr = function (name, init) {
  var val;
  if (val = this[name]) return this.get(name);
  
  var data = typeof init === 'function' ? init() : init;
  this.set(name, data);
  return this.get(name); // set()에서 변환되므로, 다시 get()해야.
};
Storage.prototype.asyncGetOr = function (name, promise) {
  var val;
  if (val = this[name]) return new Promise(rs => rs(this.get(name)));
  
  return promise.then(data => {
    this.set(name, data);
    return this.get(name);
  });
};