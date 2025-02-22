chrome.contextMenus.create({
  id: "searchLaw",
  title: "関連する法令文書を検索",
  contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "searchLaw") {
      chrome.storage.local.set({ nowEditSearchWord: info.selectionText }, () => {
          chrome.action.openPopup();
      });
  }
});
