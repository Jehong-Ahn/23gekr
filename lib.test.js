const { Entity, List, Title, TitleList, Chapter } = require("./lib");
const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

test("Storage#set() should convert numbers to strings", () => {
  const storage = new Storage();
  storage.set("a", 1);
  expect(storage.get("a")).toEqual("1");
});

test("Storage#get() should parse JSON strings into objects", () => {
  const storage = new Storage();
  storage.set("a", {b:1});
  expect(storage.get("a")).toEqual({b:1});
});

test("Storage#getOr() should return the existing value if it exists", () => {
  const storage = new Storage();
  storage.set("foo", "bar");
  expect(storage.getOr("foo", 1)).toEqual("bar");
});

test("Storage#getOr() should return the default value if the key does not exist", () => {
  const storage = new Storage();
  expect(storage.getOr("foo", 1)).toEqual("1");
});

test("Storage#getOr() should use the init function to generate the default value if the key does not exist", () => {
  const storage = new Storage();
  expect(storage.getOr("foo", ()=>1)).toEqual("1");
});

test("Storage#asyncGetOr() should return the existing value if it exists", async () => {
  const storage = new Storage();
  storage.set("foo", "bar");
  expect(await storage.asyncGetOr("foo")).toEqual("bar");
});

test("Storage#asyncGetOr() should use the init promise to generate the default value if the key does not exist", async () => {
  const storage = new Storage();
  expect(await storage.asyncGetOr("foo", new Promise(rs=>rs(1)))).toEqual("1");
});

test("Entity#compact() should return an object with keys in the specified order", () => {
  const entity = new Entity({a:1, b:2, c:3});
  expect(entity.compact(["a", "c", "b"])).toEqual({a:1, c:3, b:2});
});

test("Title#saveToLocal() should save the title to local storage", () => {
  const title = new Title({id: "123", name: "Test Title", author: "Author", touched: 123456});
  title.saveToLocal();
  expect(localStorage.get(title.id)).toEqual({name: "Test Title", author: "Author", touched: 123456});
});

test("Title#unshiftToSession() should add the title to the beginning of the session storage array", () => {
  sessionStorage.set("titles", [ { id: "1", name: "foo" } ]);
  const title = new Title({id: "2", name: "Test Title", author: "Author", touched: 123456});
  title.unshiftToSession();
  expect(sessionStorage.get("titles")).toEqual([
    { id: "2", name: "Test Title", author: "Author", touched: 123456, chapters: [] },
    { id: "1", name: "foo" }
  ]);
});

test("TitleList#toSortedArr() should return an array of titles sorted by 'touched' in descending order", () => {
  const titleList = new TitleList({
    a: new Title({ id: "a", touched: 10 }),
    b: new Title({ id: "b", touched: 20 }),
  });
  const sortedArr = titleList.toSortedArr();
  expect(sortedArr).toEqual([
    new Title({ id: "b", touched: 20 }),
    new Title({ id: "a", touched: 10 }),
  ]);
});

test("TitleList.fromLocal() should return a new TitleList if there is no data in local storage", () => {
  const titleList = TitleList.fromLocal();
  expect(titleList).toEqual(new TitleList());
});

test("TitleList.fromLocal() should skip entries without a title when loading from local storage", () => {
  localStorage.set("book1|ch1", { no:1, name:1 });
  const titleList = TitleList.fromLocal();
  expect(titleList).toEqual(new TitleList());
});

test("TitleList.fromLocal() should create a TitleList from local storage, add id and code to each title, and sort chapters", () => {
  localStorage.set("_foo", "bar");
  localStorage.set("book1|ch1", { no:1, name:1 });
  localStorage.set("book1|ch2", { no:2, name:2 });
  localStorage.set("book2|ch1", { no:1, name:1 });
  localStorage.set("book2|ch2", { no:2, name:2 });
  localStorage.set("book1", { name:1, author:1, touched:1 });
  localStorage.set("book2", { name:2, author:2, touched:2 });
  const titleList = TitleList.fromLocal();
  expect(titleList).toEqual(new TitleList({
    book1: new Title({
      id: "book1", name: 1, author: 1, touched: 1,
      chapters: [
        new Chapter({ titleId: "book1", code: "ch2", no: 2, name:2 }),
        new Chapter({ titleId: "book1", code: "ch1", no:1, name:1 }) 
      ]
    }),
    book2: new Title({
      id: "book2", name: 2, author: 2, touched: 2,
      chapters: [
        new Chapter({ titleId: "book2", code: "ch2", no: 2, name:2 }),
        new Chapter({ titleId: "book2", code: "ch1", no:1, name:1 }) 
      ]
    }),
  }));
});

test("TitleList.fromLocalAndSync() should return a new TitleList if there is no data in local storage", async () => {
  expect(await TitleList.fromLocalAndSync()).toEqual(new TitleList());
});

test("TitleList.fromLocalAndSync() should sync with remote then update local data", async () => {

  fetchMock.mockResponseOnce("header\nbook1\tNew Title\tNew Author");

  localStorage.set("_foo", "bar");
  localStorage.set("book1|ch1", { no:1, name:1 });
  localStorage.set("book1|ch2", { no:2, name:2 });
  localStorage.set("book2|ch1", { no:1, name:1 });
  localStorage.set("book2|ch2", { no:2, name:2 });
  localStorage.set("book1", { name:1, author:1, touched:1 });
  localStorage.set("book2", { name:2, author:2, touched:2 });
  expect(await TitleList.fromLocalAndSync()).toEqual(new TitleList({
    book1: new Title({
      id: "book1", name: "New Title", author: "New Author", touched: 1,
      chapters: [
        new Chapter({ titleId: "book1", code: "ch2", no: 2, name:2 }),
        new Chapter({ titleId: "book1", code: "ch1", no:1, name:1 }) 
      ]
    }),
    book2: new Title({
      id: "book2", name: 2, author: 2, touched: 2,
      chapters: [
        new Chapter({ titleId: "book2", code: "ch2", no: 2, name:2 }),
        new Chapter({ titleId: "book2", code: "ch1", no:1, name:1 }) 
      ]
    }),
  }));
});

test("Chapter#saveToLocal() should save the chapter to local storage", () => {
  const chapter = new Chapter({ titleId: "123", code: "456", name: "Test Chapter", no: 1 });
  chapter.saveToLocal();
  expect(Chapter.fromLocal(chapter.titleId, chapter.code)).toEqual(chapter);
});

test("Chapter#removeFromLocalAndSession() should remove the chapter from local storage", () => {
  const chapter = new Chapter({ titleId: "123", code: "456", name: "Test Chapter", no: 1 });
  chapter.saveToLocal();
  
  chapter.removeFromLocalAndSession();
  
  expect(Chapter.fromLocal(chapter.titleId, chapter.code)).toBeNull();
});

test("Chapter#removeFromLocalAndSession() should remove the chapter from the session storage", () => {
  const chapter = new Chapter({ titleId: "123", code: "456", name: "Test Chapter", no: 1 });
  const title = new Title({ id: "123", name: "Test Title", author: "Author", touched: 123456, chapters: [chapter] });
  const titleList = new TitleList({ 123: title });
  titleList.saveToSession();

  let cachedTitle = sessionStorage.get("titles").find(o => o.id === chapter.titleId);
  expect(cachedTitle.chapters.find(o => o.code === chapter.code)).toEqual(chapter.toJSON());

  chapter.removeFromLocalAndSession();

  cachedTitle = sessionStorage.get("titles").find(o => o.id === chapter.titleId);
  expect(cachedTitle.chapters.find(o => o.code === chapter.code)).toBeUndefined();
});

// test("Chapter#removeFromLocalAndSession() should not modify other chapters in the session storage", () => {
//   const chapter1 = new Chapter({ titleId: "123", code: "456" });
//   const chapter2 = new Chapter({ titleId: "123", code: "789" });
//   const title = new Title({ id: "123", name: "Test Title", author: "Author", touched: 123456, chapters: [chapter1, chapter2] });
//   sessionStorage.set("titles", [title]);
//   chapter1.removeFromLocalAndSession();
//   const updatedTitle = sessionStorage.get("titles").find(o => o.id === chapter1.titleId);
//   expect(updatedTitle.chapters.find(o => o.code === chapter2.code)).toEqual(chapter2);
// });

// test("Chapter#removeFromLocalAndSession() should not modify other titles in the session storage", () => {
//   const chapter = new Chapter({ titleId: "123", code: "456" });
//   const title1 = new Title({ id: "123", name: "Test Title", author: "Author", touched: 123456, chapters: [chapter] });
//   const title2 = new Title({ id: "456", name: "Another Title", author: "Another Author", touched: 123456, chapters: [] });
//   sessionStorage.set("titles", [title1, title2]);
//   chapter.removeFromLocalAndSession();
//   const updatedTitles = sessionStorage.get("titles");
//   expect(updatedTitles.find(o => o.id === title2.id)).toEqual(title2);
// });