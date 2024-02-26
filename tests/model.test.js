require("../dist/lib");
const { Entity, List, Title, TitleList, Chapter } = require("../dist/model");
const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

test("Entity#constructor() should create an instance with the given data", () => {
  const data = {a:1, b:2, c:3};
  const entity = new Entity(data);
  expect(entity).toEqual(data);
});

test("Entity#constructor() should create an empty instance if no data is given", () => {
  const entity = new Entity();
  expect(entity).toEqual({});
});

test("Entity#required() should not throw an error if all required keys exist", () => {
  const entity = new Entity({a:1, b:2, c:3});
  expect(() => entity.required(['a', 'b', 'c'])).not.toThrow();
});

test("Entity#required() should throw an error if a required key does not exist", () => {
  const entity = new Entity({a:1, b:2});
  expect(() => entity.required(['a', 'b', 'c'])).toThrow();
});

test("Entity#compact() should return an object with only the specified keys", () => {
  const entity = new Entity({a:1, b:2, c:3});
  expect(entity.compact(['a', 'c'])).toEqual({a:1, c:3});
});

test("Entity#compact() should return an empty object if no keys are specified", () => {
  const entity = new Entity({a:1, b:2, c:3});
  expect(entity.compact([])).toEqual({});
});

test("List#size() should return 0 when the entity has no keys", () => {
  const list = new List({});
  expect(list.size()).toEqual(0);
});

test("List#size() should return the number of keys in the list", () => {
  const list = new List({a:1, b:2, c:3});
  expect(list.size()).toEqual(3);
});

test("List#size() should not count keys added to the prototype", () => {
  List.prototype.d = 4;
  const list = new List({a:1, b:2, c:3});
  expect(list.size()).toEqual(3);
  delete List.prototype.d;
});

test("Title#saveToLocal() should save the title to local storage", () => {
  const title = new Title({id: "123", name: "Test Title", author: "Author", touched: 123456});
  title.saveToLocal();
  expect(localStorage.get(title.id)).toEqual({name: "Test Title", author: "Author", touched: 123456});
});

test("Title#addToSession() should add the title", () => {
  const titleList = new TitleList();
  titleList.saveToSession();

  const title = new Title({id: "2", name: "Test Title", author: "Author", touched: 123456});
  title.addToSession();

  expect(TitleList.fromSession()).toEqual(new TitleList({2: title}));
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

  fetchMock.mockResponseOnce("header"
    +"\ntitle1\tNew Title\tnewbar\tnewbaz"
    +"\ntitle2\tfoo\tNew Author\tnewbaz"
    +"\ntitle3\tfoo\tbar\tNew Channels"
  );

  localStorage.set("_foo", "bar");
  localStorage.set("title1", { name:"foo", author:"bar", channels:"baz" });
  localStorage.set("title2", { name:"foo", author:"bar", channels:"baz" });
  localStorage.set("title3", { name:"foo", author:"bar", channels:"baz" });
  expect(await TitleList.fromLocalAndSync()).toEqual(new TitleList({
    title1: new Title({ id: "title1", name: "New Title", author: "newbar", channels: "newbaz" }),
    title2: new Title({ id: "title2", name: "foo", author: "New Author", channels: "newbaz" }),
    title3: new Title({ id: "title3", name: "foo", author: "bar", channels: "New Channels" }),
  }));
});

test("TitleList.fromSession() should return a TitleList instance from the session storage", () => {
  const titleList = new TitleList({
    a: new Title({ id: "a", name: "Test Title A", author: "Author A", touched: 123456 }),
  });
  titleList.saveToSession();

  const retrievedTitleList = TitleList.fromSession();
  expect(retrievedTitleList).toEqual(titleList);
});

test("TitleList.fromSession() should return null if 'titles' is not in the session storage", () => {
  delete sessionStorage["titles"];
  const result = TitleList.fromSession();
  expect(result).toBeNull();
});

describe('TitleList.init', () => {
  let fromSessionSpy, fromLocalAndSyncSpy, saveToSessionSpy;

  beforeEach(() => {
    fromSessionSpy = jest.spyOn(TitleList, 'fromSession');
    fromLocalAndSyncSpy = jest.spyOn(TitleList, 'fromLocalAndSync');
    saveToSessionSpy = jest.spyOn(TitleList.prototype, 'saveToSession');
  });

  afterEach(() => {
    fromSessionSpy.mockRestore();
    fromLocalAndSyncSpy.mockRestore();
    saveToSessionSpy.mockRestore();
  });

  test("should return a promise that resolves to a TitleList from session if it exists", () => {
    const titleList = new TitleList();
    fromSessionSpy.mockReturnValue(titleList);
    return TitleList.init().then(result => {
      expect(result).toBe(titleList);
    });
  });

  test("should return a promise that resolves to a TitleList from local and sync if session does not exist", () => {
    const titleList = new TitleList();
    fromSessionSpy.mockReturnValue(null);
    fromLocalAndSyncSpy.mockReturnValue(Promise.resolve(titleList));
    return TitleList.init().then(result => {
      expect(result).toBe(titleList);
      expect(saveToSessionSpy).toHaveBeenCalled();
    });
  });
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

  let cachedTitle = TitleList.fromSession()[chapter.titleId];
  expect(cachedTitle.chapters.find(o => o.code === chapter.code)).toEqual(chapter);

  chapter.removeFromLocalAndSession();

  cachedTitle = TitleList.fromSession()[chapter.titleId];
  expect(cachedTitle.chapters.find(o => o.code === chapter.code)).toBeUndefined();
});

