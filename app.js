let mangaList;

main();
var button = document.getElementById("myButton");
button.addEventListener("click", manga);

async function main() {
  // fetch manga list from AniList
  const q = {};
  q.query = await fetchQuery("./queries/mangaList.graphql");
  const data = await fetchData(q, { userId: 6653232 });
  mangaList = extractMangaList(data);

  manga();
}

async function manga() {
  const q = {};

  // pick random manga
  const manga = mangaList[Math.floor(Math.random() * mangaList.length)];
  const mediaId = manga.mediaId;

  // fetch manga data from AniList
  q.query = await fetchQuery("./queries/manga.graphql");
  const data = await fetchData(q, { id: mediaId });

  // manga dom
  const mangaDiv = document.getElementById("manga");
  mangaDiv.innerHTML = "";

  // cover image
  const coverImage = document.createElement("img");
  coverImage.id = "cover-image";
  coverImage.src = data.Media.coverImage.large;
  mangaDiv.append(coverImage);

  // content dom
  const title = document.createElement("div");
  title.style.display = "flex";
  title.style.flexDirection = "column";
  title.style.gap = "0.3rem";

  // title native
  const titleNative = document.createElement("h1");
  titleNative.id = "title-native";
  titleNative.innerText = data.Media.title.native;
  title.append(titleNative);

  // title romaji
  const titleRomaji = document.createElement("p");
  titleRomaji.id = "title-romaji";
  titleRomaji.innerText = data.Media.title.romaji;
  title.append(titleRomaji);

  // artists
  const artists = extractArtists(data);
  const artistsContainer = document.createElement("div");
  artistsContainer.id = "artists-container";
  for (let key in artists) {
    const artist = document.createElement("span");
    artist.classList.add("artist");
    artist.innerText = artists[key].node.name.native;

    const artistHover = document.createElement("span");
    artistHover.classList.add("hover-box");
    artistHover.innerText = artists[key].role;

    artist.append(artistHover);
    artistsContainer.append(artist);
  }
  title.append(artistsContainer);

  // tags
  const tags = extractTags(data);
  const tagsContainer = document.createElement("div");
  tagsContainer.id = "tags-container";
  tags.forEach((tagString) => {
    const tag = document.createElement("span");
    tag.classList.add("tag");
    tag.innerText = tagString;
    if (tagString == "Adult" || tagString == "Hentai") {
      tag.classList.add("adult");
    }
    tagsContainer.append(tag);
  });
  title.append(tagsContainer);

  // scores
  const scoresContainer = document.createElement("div");
  scoresContainer.id = "scores-container";

  //my score
  const myScoreContainer = document.createElement("span");
  myScoreContainer.classList.add("score");
  myScoreContainer.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 Z"></path></svg>';
  const myScore = document.createElement("span");
  myScore.innerText = manga.score;
  myScoreContainer.append(myScore);

  const myScoreHover = document.createElement("span");
  myScoreHover.classList.add("hover-box");
  myScoreHover.innerText = "My Rating";
  myScoreContainer.append(myScoreHover);

  scoresContainer.append(myScoreContainer);

  // average score
  const averageScoreContainer = document.createElement("span");
  averageScoreContainer.classList.add("score");
  averageScoreContainer.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><g><circle cx="12" cy="6.75" r="3.75"/><path d="M6 21 V15 a1.5 1.5 0 0 1 1.5 -1.5 H16.5 a1.5 1.5 0 0 1 1.5 1.5 v6"/</g></svg>';
  const averageScore = document.createElement("span");
  averageScore.innerText = data.Media.averageScore / 10;
  averageScoreContainer.append(averageScore);

  const averageScoreHover = document.createElement("span");
  averageScoreHover.classList.add("hover-box");
  averageScoreHover.innerText = "Others' Rating";
  averageScoreContainer.append(averageScoreHover);

  scoresContainer.append(averageScoreContainer);

  title.append(scoresContainer);

  // description
  const desc = document.createElement("p");
  desc.id = "";
  desc.innerHTML = extractDescription(data);
  title.append(desc);

  mangaDiv.appendChild(title);
}

async function fetchQuery(url) {
  try {
    const response = await fetch(url).then((res) => {
      return res.text();
    });

    if (response.errors) {
      console.log(response.errors);
    }
    return response;
  } catch (e) {
    console.log(e);
    return null;
  }
}

async function fetchData(query, variables) {
  query.variables = variables;
  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      body: JSON.stringify(query),
      headers: { "Content-Type": "application/json" },
    }).then((res) => res.json());

    if (response.errors) {
      console.log(response.errors);
    }
    return response.data;
  } catch (e) {
    console.log(e);
    return null;
  }
}

function extractMangaList(data) {
  return data.MediaListCollection.lists
    .filter((list) => list.name == "Completed")[0]
    .entries.filter((entry) => entry.score >= 8);
}

function extractArtists(data) {
  return data.Media.staff.edges.filter(
    (edge) =>
      edge.role == "Story" ||
      edge.role == "Art" ||
      edge.role == "Story & Art" ||
      edge.role.includes("Original")
  );
}

function extractTags(data) {
  const tags = [];

  if (data.Media.format == "ONE_SHOT") {
    tags.push("One Shot");
  }

  if (data.Media.isAdult) {
    tags.push("Adult");
  }

  for (let key in data.Media.genres) {
    if (data.Media.genres.hasOwnProperty(key)) {
      tags.push(data.Media.genres[key]);
    }
  }
  return tags;
}

function extractDescription(data) {
  let desc = data.Media.description;
  let target = "(Source:";

  let index = desc.indexOf(target);
  if (index !== -1) {
    desc = desc.substring(0, index);
  }

  return desc.replace(/^(<br>)+|(<br>)+$/g, "");
}
