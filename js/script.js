// Adicionamos um "ouvinte" de evento que espera todo o HTML da página ser carregado
// antes de executar qualquer código JavaScript. Isso evita erros de "elemento não encontrado".
document.addEventListener('DOMContentLoaded', () => {

    // --- INICIALIZAÇÃO DA BIBLIOTECA DE ANIMAÇÕES (AOS) ---
    // Aqui, iniciamos a biblioteca Animate On Scroll com algumas configurações padrão.
    AOS.init({
        duration: 800,    // Duração da animação em milissegundos.
        once: true,       // A animação acontece apenas uma vez por elemento.
        offset: 50,       // A animação começa um pouco antes do elemento entrar na tela.
    });


    // --- LÓGICA DO ALTERNADOR DE TEMA (DARK/LIGHT) ---
    const themeSwitcher = document.querySelector('.theme-switcher');
    const doc = document.documentElement; // Referência ao elemento <html>

    // Função que aplica o tema salvo no navegador ou o tema padrão do sistema operacional.
    function applyTheme() {
        // 1. Procura por um tema salvo no localStorage.
        // 2. Se não encontrar, verifica se o sistema do usuário prefere o tema escuro.
        // 3. Se nenhuma das opções acima, usa 'light' como padrão.
        const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        doc.setAttribute('data-theme', savedTheme);
    }

    if (themeSwitcher) {
        // Adiciona um evento de clique ao botão do tema.
        themeSwitcher.addEventListener('click', () => {
            const currentTheme = doc.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark'; // Inverte o tema atual.
            doc.setAttribute('data-theme', newTheme); // Aplica o novo tema ao HTML.
            localStorage.setItem('theme', newTheme); // Salva a preferência no navegador.
        });
    }
    applyTheme(); // Aplica o tema correto assim que a página carrega.


    // --- LÓGICA DO FEED DE NOTÍCIAS (REINSERIDO) ---
    const newsContainer = document.getElementById('news-container');
    
    // Função assíncrona para buscar notícias de uma API externa.
    async function fetchNews() {
        if (!newsContainer) return; // Se o container de notícias não existir, para a execução.

        // IMPORTANTE: Substitua pela sua chave de API pessoal do GNews.io
        const apiKey = "2a97dbaa4c73672427519139ae09de60"; 
        const query = "cybersecurity OR hacking OR malware OR ransomware OR vulnerability";
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=pt&sortby=publishedAt&max=3&token=${apiKey}`;

        // O bloco try...catch lida com possíveis erros de rede ou da API.
        try {
            const response = await fetch(url); // Espera a resposta da API.
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
            const data = await response.json(); // Converte a resposta em formato JSON.

            newsContainer.innerHTML = ""; // Limpa a mensagem "Carregando...".

            if (data.articles && data.articles.length > 0) {
                // Para cada artigo recebido, cria um card de notícia e o insere na página.
                data.articles.forEach(article => {
                    const newsCard = `
                        <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="news-card" data-aos="fade-up">
                            <img loading="lazy" src="${article.image || './assets/images/default-news.jpg'}" alt="${article.title}">
                            <h5>${article.title}</h5>
                            <div class="news-footer">
                                <span class="source">${article.source.name}</span>
                                <span class="date">${new Date(article.publishedAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </a>
                    `;
                    newsContainer.innerHTML += newsCard;
                });
            } else {
                newsContainer.innerHTML = "<p>Não foi possível carregar as notícias no momento.</p>";
            }
        } catch (error) {
            console.error("Erro ao buscar notícias:", error);
            newsContainer.innerHTML = "<p>Erro de conexão ao feed de notícias.</p>";
        }
    }
    fetchNews(); // Chama a função para buscar as notícias.


    // --- LÓGICA DO CARROSSEL ---
    const carouselSlide = document.querySelector('.carousel-slide');
    const carouselItems = document.querySelectorAll('.carousel-item');
    const prevButton = document.querySelector('.carousel-prev');
    const nextButton = document.querySelector('.carousel-next');
    if (carouselSlide && carouselItems.length > 0 && prevButton && nextButton) {
        let currentIndex = 0;
        const totalSlides = carouselItems.length;
        function updateCarousel() { carouselSlide.style.transform = `translateX(-${currentIndex * 100}%)`; }
        nextButton.addEventListener('click', () => { currentIndex = (currentIndex + 1) % totalSlides; updateCarousel(); });
        prevButton.addEventListener('click', () => { currentIndex = (currentIndex - 1 + totalSlides) % totalSlides; updateCarousel(); });
        // O carrossel só avança automaticamente se a aba do navegador estiver em foco.
        setInterval(() => { if (document.hasFocus()) { nextButton.click(); } }, 5000);
    }

    
    // --- LÓGICA GENÉRICA PARA MÚLTIPLOS MODAIS ---
    // Esta função reutilizável configura qualquer modal, evitando código repetido.
    function setupModal(triggerSelector, modalId, dataProvider) {
        const openButtons = document.querySelectorAll(triggerSelector);
        const modal = document.getElementById(modalId);

        if (openButtons.length > 0 && modal) {
            const closeModalBtn = modal.querySelector('.close-modal-btn');
            
            const openModal = (dataId) => {
                // Se uma função para preencher dados foi fornecida (como para serviços ou casos), ela é chamada aqui.
                if (dataProvider) {
                    dataProvider(dataId);
                }
                modal.classList.add('active'); // Torna o modal visível
                document.body.classList.add('modal-open'); // Trava a rolagem da página
            };

            const closeModal = () => {
                modal.classList.remove('active');
                document.body.classList.remove('modal-open');
            };

            // Adiciona o evento de abrir a todos os botões correspondentes.
            openButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.serviceId || btn.dataset.caseId;
                    openModal(id);
                });
            });

            if (closeModalBtn) {
                closeModalBtn.addEventListener('click', closeModal);
            }
            // Permite fechar o modal clicando no fundo (overlay).
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    closeModal();
                }
            });
        }
    }


    // --- DADOS E SETUP DO MODAL DE SERVIÇOS ---
    // "Banco de dados" local para o conteúdo dos modais de serviço.
    const servicesData = {
        pentest: { title: "Análise de Vulnerabilidades [Pentest]", image: "./assets/images/#", price: "A partir de R$ 3.500", description: "Nossa metodologia de Pentest simula um ataque cibernético real e controlado..." },
        soc: { title: "Monitoramento e Resposta | SOC 24/7", image: "./assets/images/#", price: "Planos mensais", description: "Nosso Centro de Operações de Segurança (SOC) funciona como sua torre de controle de segurança..." },
        lgpd: { title: "Compliance e Treinamento", image: "./assets/images/#", price: "Projetos customizados", description: "Alinhamos sua empresa à Lei Geral de Proteção de Dados (LGPD)..." }
    };
    // Função que preenche o modal de serviço com os dados corretos.
    window.populateServiceModal = (serviceId) => {
        const data = servicesData[serviceId];
        if (!data) return;
        document.getElementById('service-modal-title').textContent = data.title;
        document.getElementById('service-modal-body').innerHTML = `<div class="service-modal-content"><div class="service-modal-image"><img src="${data.image}" alt="${data.title}"></div><div class="service-modal-details"><h5>Como é Feito:</h5><p>${data.description}</p><h5>Investimento:</h5><p class="price">${data.price}</p></div></div>`;
    };
    // Conecta os botões '.service-details-btn' ao modal '#service-modal'.
    setupModal('.service-details-btn', 'service-modal', window.populateServiceModal);


    // --- DADOS E SETUP DO MODAL DE ESTUDOS DE CASO ---
    const caseStudiesData = {
        financeiro: { title: "Blindagem de Infraestrutura para o Setor Financeiro", client: "Fintech InovaCredit", sector: "Financeiro", challenge: "O cliente precisava garantir a segurança de dados sensíveis...", solution: "Realizamos um Pentest completo...", results: [ { stat: "98%", label: "Redução de Vulnerabilidades Críticas" }, { stat: "100%", label: "Conformidade com Normas" }, { stat: "0", label: "Incidentes Pós-Implementação" } ] },
        varejista: { title: "Implementação de SOC Contínuo para Varejista", client: "Rede Varejista Express", sector: "Varejo", challenge: "Com múltiplas lojas e um e-commerce em crescimento...", solution: "Implementamos nosso serviço de SOC 24/7...", results: [ { stat: "24/7", label: "Monitoramento Contínuo" }, { stat: "90%", label: "Redução no Tempo de Detecção" }, { stat: "5 min", label: "Tempo Médio de Resposta" } ] },
        saude: { title: "Adequação Completa à LGPD para Startup de Saúde", client: "HealthTech Vitalis", sector: "Saúde", challenge: "Como uma startup de saúde, o cliente lidava com dados pessoais sensíveis...", solution: "Conduzimos um projeto completo de adequação à LGPD...", results: [ { stat: "100%", label: "Conformidade com a LGPD" }, { stat: "3", label: "Novos Contratos Corporativos" }, { stat: "0", label: "Violações de Dados" } ] }
    };
    window.populateCaseStudyModal = (caseId) => {
        const data = caseStudiesData[caseId];
        if(!data) return;
        document.getElementById('case-study-modal-title').textContent = data.title;
        document.getElementById('case-study-modal-body').innerHTML = `<div class="case-study-content"><div class="case-study-header"><h5>Cliente: <span>${data.client}</span></h5><h5>Setor: <span>${data.sector}</span></h5></div><div class="case-study-body"><h6>O Desafio</h6><p>${data.challenge}</p><h6>Nossa Solução</h6><p>${data.solution}</p></div><div class="case-study-results">${data.results.map(item => `<div class="result-item"><div class="stat">${item.stat}</div><div class="label">${item.label}</div></div>`).join('')}</div></div>`;
    };
    setupModal('.carousel-item[data-case-id]', 'case-study-modal', window.populateCaseStudyModal);
    

    // --- SETUP DO MODAL DE CONTATO ---
    // Apenas configura o modal de contato, sem necessidade de dados dinâmicos.
    setupModal('.open-contact-btn', 'contact-modal');
    

    // --- LÓGICA DO FORMULÁRIO DE CONTATO (DENTRO DO MODAL) ---
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    if (contactForm && formStatus) {
        async function handleSubmit(event) {
            event.preventDefault();
            const formData = new FormData(event.target);
            formStatus.innerHTML = "Enviando...";
            formStatus.className = 'success';
            formStatus.style.display = 'block';
            try {
                const response = await fetch(event.target.action, { method: contactForm.method, body: formData, headers: { 'Accept': 'application/json' } });
                if (response.ok) {
                    formStatus.innerHTML = "Transmissão Concluída.";
                    formStatus.className = 'success';
                    contactForm.reset();
                    setTimeout(() => {
                        const activeModal = document.querySelector('#contact-modal.active');
                        if (activeModal) activeModal.querySelector('.close-modal-btn').click();
                    }, 2000);
                } else {
                    response.json().then(data => {
                        if (Object.hasOwn(data, 'errors')) { formStatus.innerHTML = data["errors"].map(error => error["message"]).join(", "); } 
                        else { formStatus.innerHTML = "ERRO NA TRANSMISSÃO."; }
                        formStatus.className = 'error';
                    });
                }
            } catch (error) {
                formStatus.innerHTML = "FALHA DE CONEXÃO.";
                formStatus.className = 'error';
            }
        }
        contactForm.addEventListener("submit", handleSubmit);
    }
    
    
    // --- LÓGICA DO BOTÃO "VOLTAR AO TOPO" ---
    const backToTopButton = document.querySelector(".back-to-top");
    if (backToTopButton) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 300) { backToTopButton.classList.add("visible"); } 
            else { backToTopButton.classList.remove("visible"); }
        });
    }

    // --- LISTENER GLOBAL PARA TECLA 'ESC' ---
    // Este evento fecha QUALQUER modal que estiver aberto ao pressionar a tecla 'Escape'.
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                modal.querySelector('.close-modal-btn').click();
            });
        }
    });
});