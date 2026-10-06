export const STORAGE_KEY = "pulso-workspace-v1";

export const statuses = [
  { id: "todo", label: "A fazer", color: "gray" },
  { id: "doing", label: "Em andamento", color: "blue" },
  { id: "done", label: "Concluído", color: "green" }
];

export function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function offsetDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDate(date);
}

export function createDemo() {
  return {
    clients: [
      {
        id: "c1",
        name: "Estúdio Norte",
        contact: "Marina Costa",
        email: "marina@example.com",
        color: "peach"
      },
      {
        id: "c2",
        name: "Casa Botânica",
        contact: "Lucas Alves",
        email: "lucas@example.com",
        color: "sage"
      },
      {
        id: "c3",
        name: "Órbita Records",
        contact: "Ana Lima",
        email: "ana@example.com",
        color: "lilac"
      },
      {
        id: "c4",
        name: "Café Aurora",
        contact: "Pedro Santos",
        email: "pedro@example.com",
        color: "yellow"
      }
    ],

    projects: [
      {
        id: "p1",
        name: "Website editorial",
        clientId: "c1",
        category: "Web design",
        status: "doing",
        due: offsetDate(4),
        value: 4800,
        paid: false
      },
      {
        id: "p2",
        name: "Identidade visual",
        clientId: "c2",
        category: "Branding",
        status: "doing",
        due: offsetDate(9),
        value: 3200,
        paid: true
      },
      {
        id: "p3",
        name: "Campanha de lançamento",
        clientId: "c3",
        category: "Direção de arte",
        status: "todo",
        due: offsetDate(15),
        value: 2600,
        paid: false
      },
      {
        id: "p4",
        name: "Landing page de reservas",
        clientId: "c4",
        category: "Web design",
        status: "todo",
        due: offsetDate(20),
        value: 1800,
        paid: false
      },
      {
        id: "p5",
        name: "Kit de redes sociais",
        clientId: "c2",
        category: "Social media",
        status: "done",
        due: offsetDate(-5),
        value: 1200,
        paid: true
      },
      {
        id: "p6",
        name: "Direção visual do EP",
        clientId: "c3",
        category: "Direção de arte",
        status: "doing",
        due: offsetDate(-2),
        value: 2400,
        paid: false
      }
    ]
  };
}

export function validateWorkspace(data) {
  if (!data || !Array.isArray(data.clients) || !Array.isArray(data.projects)) {
    return false;
  }

  const clientIds = new Set();
  const projectIds = new Set();

  const clientsValid = data.clients.every((client) => {
    if (
      !client ||
      typeof client.id !== "string" ||
      clientIds.has(client.id) ||
      typeof client.name !== "string" ||
      typeof client.contact !== "string" ||
      typeof client.email !== "string" ||
      !["peach", "sage", "lilac", "yellow"].includes(client.color)
    ) return false;

    clientIds.add(client.id);
    return true;
  });

  const projectsValid = data.projects.every((project) => {
    if (
      !project ||
      typeof project.id !== "string" ||
      projectIds.has(project.id) ||
      typeof project.name !== "string" ||
      typeof project.category !== "string" ||
      !clientIds.has(project.clientId) ||
      !statuses.some((status) => status.id === project.status) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(project.due) ||
      !Number.isFinite(project.value) ||
      project.value < 0 ||
      typeof project.paid !== "boolean"
    ) return false;

    projectIds.add(project.id);
    return true;
  });

  return clientsValid && projectsValid;
}

export function loadWorkspace() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { data: createDemo(), warning: "" };

    const data = JSON.parse(saved);
    if (!validateWorkspace(data)) throw new Error("Invalid workspace");

    return { data, warning: "" };
  } catch {
    return {
      data: createDemo(),
      warning: "Não foi possível recuperar os dados. Carregamos os exemplos."
    };
  }
}