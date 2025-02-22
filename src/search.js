document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["nowEditSearchWord", "nowEditCancelScore", "nowEditLimit", "cacheResults"], (data) => {
      const searchBox = document.getElementById("searchBox");
      const cancelScore = document.getElementById("cancelScore");
      const cancelScoreSlider = document.getElementById("cancelScoreSlider");
      const limit = document.getElementById("limit");
      const limitSlider = document.getElementById("limitSlider");

      if (data.nowEditSearchWord) {
          searchBox.value = data.nowEditSearchWord;
          performSearch();
      }

      if (data.cacheResults) {
        displayResults(data.cacheResults)
      }

      cancelScore.value = data.nowEditCancelScore ?? 0.5;
      cancelScoreSlider.value = data.nowEditCancelScore ?? 0.5;
      limit.value = data.nowEditLimit ?? 100;
      limitSlider.value = data.nowEditLimit ?? 100;
  });
});

document.getElementById("searchButton").addEventListener("click", performSearch);
document.getElementById("cancelScore").addEventListener("input", syncCancelScore);
document.getElementById("cancelScoreSlider").addEventListener("input", syncCancelScore);
document.getElementById("limit").addEventListener("input", syncLimit);
document.getElementById("limitSlider").addEventListener("input", syncLimit);

function syncCancelScore(event) {
  const value = parseFloat(event.target.value);
  document.getElementById("cancelScore").value = value;
  document.getElementById("cancelScoreSlider").value = value;
  chrome.storage.local.set({ nowEditCancelScore: value });
}

function syncLimit(event) {
  const value = parseInt(event.target.value);
  document.getElementById("limit").value = value;
  document.getElementById("limitSlider").value = value;
  chrome.storage.local.set({ nowEditLimit: value });
}

function performSearch() {
  const searchWord = document.getElementById("searchBox").value;
  let cancelScore = parseFloat(document.getElementById("cancelScore").value);
  let limit = parseInt(document.getElementById("limit").value);

  chrome.storage.local.get(["cacheSearchWord", "cacheCancelScore", "cacheLimit"], (cacheData) => {
    if (isNaN(cancelScore)) {
      if (cacheData.cacheCancelScore && !isNaN(cacheData.cacheCancelScore)) {
        cancelScore = cacheData.cacheCancelScore;
      } else {
        cancelScore = 0.5;
      }
    }
    if (isNaN(limit)) {
      if (cacheData.cacheLimit && !isNaN(cacheData.cacheLimit)) {
        limit = cacheData.cacheLimit;
      } else {
        limit = 0.5;
      }
    }
    console.log("cacheData: ", cacheData);
    console.log("searchWord", searchWord);
    console.log("cancelScore option", cancelScore);
    console.log("limit option", limit);
    if (!(
      cacheData.cacheSearchWord === searchWord
        && cacheData.cacheCancelScore === cancelScore
        && cacheData.cacheLimit === limit
    )) {
      console.log("search");
      chrome.storage.local.set({ cacheSearchWord: searchWord, cacheCancelScore: cancelScore, cacheLimit: limit });
    
      let url = `http://202.222.11.111:3300/v1/search?word=${encodeURIComponent(searchWord)}`;
      if (!isNaN(cancelScore) && 0.0 <= cancelScore && cancelScore <= 1.0) {
        url = `${url}&cancel_score=${cancelScore}`
      }
      if (!isNaN(limit)) {
        url = `${url}&limit=${limit}`;
      }
      console.log("url: ", url);
      fetch(url)
          .then(response => response.json())
          .then(data => {
              chrome.storage.local.set({ cacheResults: data });
              displayResults(data);
          })
          .catch(error => console.error("Error fetching data:", error));
    }
  })
}

function legal_document_url(data) {
  if (data.type === "Law") {
    return `https://laws.e-gov.go.jp/law/${data.id}`;
  }


  if (data.type === "Precedent") {
    let detail_num = "";
    if (data.info.trial_type === "SupremeCourt") {
      detail_num = "3";
    } else if (data.info.trial_type === "HighCourt") {
      detail_num = "3";
    } else if (data.info.trial_type === "LowerCourt") {
      detail_num = "4";
    } else if (data.info.trial_type === "AdministrativeCase") {
      detail_num = "5";
    } else if (data.info.trial_type === "LaborCase") {
      detail_num = "6";
    } else if (data.info.trial_type === "IPCase") {
      detail_num = "7";
    }
    return `https://www.courts.go.jp/app/hanrei_jp/detail${detail_num}?id=${data.id}`;
  }
}

function displayResults(data) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";
  data.sort((a, b) => a[0] - b[0]);
  data.forEach((item) => {
      const contents = item.contents;
      const first_data = contents[0];
      const first_document = first_data.document;
      const first_data_url = legal_document_url(first_document);
      let link = document.createElement("a");
      link.href = first_data_url;
      link.textContent = first_document.name;
      link.target = "_blank";
      resultsDiv.appendChild(link);
      resultsDiv.appendChild(document.createElement("br"));
  });
}
