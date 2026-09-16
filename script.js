const form = document.querySelector('#questionForm');
const input = document.querySelector('#question');
const title = document.querySelector('#answerTitle');
const text = document.querySelector('#answerText');
const text2 = document.querySelector('#answerText2');
const sources = document.querySelector('.sources');

function cleanQuestion(question) {
  return question.replace(/^(qui|que|qu['’]est-ce que|qu['’]est ce que|pourquoi|comment|où|ou|quand|combien|explique(?:z)?|parle(?:z)?[- ]moi de) +/i, '').replace(/[?!.]+$/g, '').trim();
}

function setSources(items) {
  sources.innerHTML = `<div class="sources-title"><span>Sources</span><small>${items.length} source${items.length > 1 ? 's' : ''}</small></div>` + items.map(item => `<a href="${item.url}" target="_blank" rel="noreferrer"><b>W</b><span><strong>${item.label}</strong><small>Wikipédia · Encyclopédie libre</small></span><i>↗</i></a>`).join('');
}

async function answerQuestion(question) {
  const query = cleanQuestion(question);
  if (!query) return;
  title.textContent = question;
  text.textContent = 'Je recherche des sources Wikipédia fiables…';
  text2.textContent = '';
  sources.innerHTML = '<div class="sources-title"><span>Sources</span><small>Recherche…</small></div>';
  document.querySelector('#answerSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  try {
    const searchUrl = `https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=2&format=json&origin=*`;
    const search = await fetch(searchUrl).then(response => response.json());
    const results = search?.query?.search || [];
    if (!results.length) throw new Error('Aucun résultat');
    const pages = await Promise.all(results.map(async result => {
      const url = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(result.title)}`;
      return fetch(url).then(response => response.ok ? response.json() : null);
    }));
    const first = pages.find(Boolean);
    if (!first?.extract) throw new Error('Aucun résumé');
    title.textContent = first.title;
    text.textContent = first.extract;
    text2.textContent = 'Cette réponse est issue de Wikipédia. Consultez les sources pour vérifier et approfondir l’information.';
    setSources(pages.filter(Boolean).map(page => ({ label: page.title, url: page.content_urls?.desktop?.page || `https://fr.wikipedia.org/wiki/${encodeURIComponent(page.title)}` })));
  } catch {
    text.textContent = 'Je n’ai pas trouvé de réponse Wikipédia suffisamment précise pour cette question.';
    text2.textContent = 'Essayez de reformuler avec des mots-clés plus simples, par exemple un nom, un lieu, une date ou un concept.';
    setSources([]);
  }
}

form.addEventListener('submit', event => { event.preventDefault(); answerQuestion(input.value); });
document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.question; answerQuestion(input.value); }));
