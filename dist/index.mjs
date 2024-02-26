import { animateParticles } from './lib.mjs';
import { TitleList, Title, Chapter } from './model.mjs';

animateParticles({
  canvas: document.getElementById('lightCanvas'),
  count: 200,
  Particle: class {
    constructor(canvas) {
      this.canvas = canvas;
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.radius = Math.random() * 2;
      this.speed = Math.random();
      this.opacity = 1 - this.y / canvas.height;
    }

    update(canvas) {
      this.y += this.speed;
      this.opacity = 1 - this.y / canvas.height;
      if (this.y > canvas.height) {
        this.y = 0;
        this.x = Math.random() * canvas.width;
        this.opacity = 1;
      }
    }
  },
});

const titleList = new TitleList({
  1: new Title({ id: "1", name: "타이틀", author: "작가", channels: "문피아", chapters: [
    new Chapter({ titleId: "1", no: "1", code: "1화", name: "1화" }),
    new Chapter({ titleId: "1", no: "2", code: "2화", name: "2화" }),
    new Chapter({ titleId: "1", no: "3", code: "3화", name: "3화" }),
    new Chapter({ titleId: "1", no: "4", code: "4화", name: "4화" }),
    new Chapter({ titleId: "1", no: "5", code: "5화", name: "5화" }),
  ] }).sortChapters(),
})

const $main = document.body.qs('main');

titleList.toSortedArr()
.forEach((title /** @type {Title} */, i) => {

  const $card = $main.ac('.card.mb-3', { data: { titleId: title.id } });
  
  const $header = $card.ac('.card-header');
  $header.innerHTML = `
    <div class="d-flex justify-content-between align-items-top">
      <div style="min-width: 0;">
        <h5>${title.name}</h5>
        <div>
          <i class="bi bi-person-fill"></i>
          <small class="text-secondary">${title.author}</small>
        </div>
      </div>
      <div>
        <!-- Three Dots 메뉴 -->
        <button class="btn dropdown-toggle no-caret pt-0 pe-0" type="button" data-bs-toggle="dropdown">
          <i class="bi bi-three-dots-vertical"></i>
        </button>
        <ul class="dropdown-menu"></ul>
      </div>
    </div>
  `;
  const $deleteMenu = $header.qs('.dropdown-menu').ac('li').ac('a.dropdown-item', { href:'#', text:'타이틀 삭제' });
  $deleteMenu.onclick = () => {
    // localStorage.delete('chapters_of:'+bookId);
    // localStorage.deleteNested('books', bookId);
    $card.remove();
  };
  
  const $body = $card.ac('.card-body');
  $body.innerHTML = `
        <!-- 신규 챕터명 입력 폼 -->
        <form class="mb-3">
            <div class="input-group">
                <input type="text" class="form-control" placeholder="신규 챕터코드">
                <button class="btn btn-primary" type="submit">입력</button>
            </div>
        </form>`
  + (title.chapters.length ? `
        <!-- 마지막으로 구매한 챕터명 -->
        <div class="mt-2">
            <i class="bi bi-skip-end-fill"></i>
            <a href="#" class="link-offset-2 link-underline link-underline-opacity-50">${title.getLastChapter().name}</a>
        </div>
  
  ` : '');
  
  if (title.cc) {
    const $chapterList = $card.ac('ul', {
      class: "list-group list-group-flush collapse border-bottom-0 overflow-y-auto",
      style: "max-height: 10em;",
      id: 'collapse'+i
    });
    
    const $footer = $card.ac({class:"card-footer text-center p-0 border-top"});
    const $moreChapterBtn = $footer.ac('button', {
      class: "btn btn-sm",
      html: `
        <span class="text-secondary">소장 챕터 목록</span>
        <span class="badge rounded-pill text-bg-secondary text-dark">${book.cc}</span>
      `,
    });
    $moreChapterBtn.once('click', event => {
      ['a','b','c','a','b','c'].forEach(tt => $chapterList.ac('.list-group-item', { text: tt }))
      $moreChapterBtn.dataset.bsToggle = "collapse";
      $moreChapterBtn.dataset.bsTarget = "#collapse"+i;
      $moreChapterBtn.click();
    });
  }
});

if (location.hostname==='localhost') setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 100);
