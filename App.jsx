import { useEffect, useRef, useState } from "react";
import {
  STORAGE_KEY,
  createDemo,
  loadWorkspace,
  localDate,
  statuses
} from "./data.js";

const navigation = [
  { id: "overview", label: "Visão geral", icon: "◫" },
  { id: "projects", label: "Projetos", icon: "▤" },
  { id: "board", label: "Quadro", icon: "▥" },
  { id: "clients", label: "Clientes", icon: "◎" },
  { id: "finance", label: "Financeiro", icon: "↗" }
];

const titles = {
  overview: ["WORKSPACE / VISÃO GERAL", "Seu trabalho tem ritmo."],
  projects: ["WORKSPACE / PROJETOS", "Da ideia à entrega."],
  board: ["WORKSPACE / QUADRO", "Tudo em movimento."],
  clients: ["WORKSPACE / CLIENTES", "Boas conexões."],
  finance: ["WORKSPACE / FINANCEIRO", "Clareza nos números."]
};

const money = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);

const dateLabel = (value) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short"
  });

const normalize = (value) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function StatusBadge({ status }) {
  const item = statuses.find((entry) => entry.id === status);
  return <span className={`status ${item.color}`}>{item.label}</span>;
}

function EmptyState({ title, description, onAction, actionLabel }) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">◌</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {onAction && (
        <button className="button primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;

    dialog.showModal();
    document.body.classList.add("modal-open");

    return () => {
      dialog.close();
      document.body.classList.remove("modal-open");
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="modalTitle"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;

        const bounds = event.currentTarget.getBoundingClientRect();
        const outside =
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom;

        if (outside) onClose();
      }}
    >
      <div className="modal-header">
        <h2 id="modalTitle">{title}</h2>
        <button className="icon-button" aria-label="Fechar" onClick={onClose}>
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}

function ProjectForm({ project, clients, onSave, onClose }) {
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const name = String(form.get("name")).trim();
    const category = String(form.get("category")).trim();
    const value = Number(form.get("value"));
    const clientId = String(form.get("clientId"));

    if (
      name.length < 2 ||
      category.length < 2 ||
      !Number.isFinite(value) ||
      value < 0 ||
      !clients.some((client) => client.id === clientId)
    ) {
      setError("Confira o nome, serviço, cliente e valor.");
      return;
    }

    onSave({
      id: project?.id || crypto.randomUUID(),
      name,
      category,
      clientId,
      due: String(form.get("due")),
      status: String(form.get("status")),
      value: Math.round(value * 100) / 100,
      paid: form.get("paid") === "on"
    });
  }

  return (
    <form onSubmit={submit} className="editor-form">
      <label>
        Nome do projeto
        <input
          name="name"
          defaultValue={project?.name || ""}
          placeholder="Ex.: Website da marca"
          required
          minLength={2}
          maxLength={80}
          autoFocus
        />
      </label>

      <div className="form-grid">
        <label>
          Cliente
          <select name="clientId" defaultValue={project?.clientId || clients[0]?.id} required>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </label>

        <label>
          Serviço
          <input
            name="category"
            defaultValue={project?.category || ""}
            placeholder="Ex.: Web design"
            required
            minLength={2}
            maxLength={50}
          />
        </label>
      </div>

      <div className="form-grid">
        <label>
          Prazo
          <input name="due" type="date" defaultValue={project?.due || localDate()} required />
        </label>

        <label>
          Valor em reais
          <input
            name="value"
            type="number"
            min="0"
            max="10000000"
            step="0.01"
            defaultValue={project?.value ?? ""}
            required
          />
        </label>
      </div>

      <label>
        Etapa do projeto
        <select name="status" defaultValue={project?.status || "todo"}>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>{status.label}</option>
          ))}
        </select>
      </label>

      <label className="checkbox-label">
        <input name="paid" type="checkbox" defaultChecked={project?.paid || false} />
        Valor recebido integralmente
      </label>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-actions">
        <button type="button" className="button secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="button primary">Salvar projeto ↗</button>
      </div>
    </form>
  );
}

function ClientForm({ client, onSave, onClose }) {
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    const contact = String(form.get("contact")).trim();

    if (name.length < 2 || contact.length < 2) {
      setError("Preencha o nome da empresa e do contato.");
      return;
    }

    onSave({
      id: client?.id || crypto.randomUUID(),
      name,
      contact,
      email: String(form.get("email")).trim(),
      color: String(form.get("color"))
    });
  }

  return (
    <form onSubmit={submit} className="editor-form">
      <p className="form-help">Use contatos fictícios neste projeto demonstrativo.</p>

      <label>
        Empresa ou marca
        <input name="name" defaultValue={client?.name || ""} required minLength={2} maxLength={80} autoFocus />
      </label>

      <label>
        Pessoa de contato
        <input name="contact" defaultValue={client?.contact || ""} required minLength={2} maxLength={80} />
      </label>

      <label>
        E-mail fictício
        <input name="email" type="email" defaultValue={client?.email || ""} placeholder="contato@example.com" required maxLength={120} />
      </label>

      <label>
        Cor de identificação
        <select name="color" defaultValue={client?.color || "sage"}>
          <option value="sage">Verde sálvia</option>
          <option value="peach">Pêssego</option>
          <option value="lilac">Lilás</option>
          <option value="yellow">Amarelo</option>
        </select>
      </label>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-actions">
        <button type="button" className="button secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="button primary">Salvar cliente ↗</button>
      </div>
    </form>
  );
}

export default function App() {
  const [initial] = useState(loadWorkspace);
  const [workspace, setWorkspace] = useState(initial.data);
  const [page, setPage] = useState("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [storageWarning, setStorageWarning] = useState(initial.warning);

  const { projects, clients } = workspace;
  const today = localDate();

  function updateWorkspace(update) {
    const next = typeof update === "function" ? update(workspace) : update;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStorageWarning("");
    } catch {
      setStorageWarning("O navegador não permite salvar. As alterações durarão apenas nesta sessão.");
    }
    setWorkspace(next);
  }

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timeout);
  }, [notice]);

  function navigate(nextPage) {
    setPage(nextPage);
    setSearch("");
    setStatusFilter("all");
    setClientFilter("all");
  }

  function clientFor(project) {
    return clients.find((client) => client.id === project.clientId);
  }

  const active = projects.filter((project) => project.status !== "done");
  const overdue = active.filter((project) => project.due < today);
  const received = projects.reduce((sum, project) => sum + (project.paid ? project.value : 0), 0);
  const pending = projects.reduce((sum, project) => sum + (!project.paid ? project.value : 0), 0);
  const contracted = received + pending;
  const receivedPercent = contracted ? Math.round(received / contracted * 100) : 0;

  const filtered = projects.filter((project) => {
    const text = normalize(`${project.name} ${project.category} ${clientFor(project)?.name || ""}`);
    return (
      text.includes(normalize(search.trim())) &&
      (statusFilter === "all" || project.status === statusFilter) &&
      (clientFilter === "all" || project.clientId === clientFilter)
    );
  });

  const filteredClients = clients.filter((client) =>
    normalize(`${client.name} ${client.contact}`).includes(normalize(search.trim()))
  );

  const upcoming = [...active].sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);

  function saveProject(project) {
    updateWorkspace((current) => ({
      ...current,
      projects: current.projects.some((entry) => entry.id === project.id)
        ? current.projects.map((entry) => entry.id === project.id ? project : entry)
        : [...current.projects, project]
    }));
    setModal(null);
    setNotice("Projeto salvo.");
  }

  function saveClient(client) {
    updateWorkspace((current) => ({
      ...current,
      clients: current.clients.some((entry) => entry.id === client.id)
        ? current.clients.map((entry) => entry.id === client.id ? client : entry)
        : [...current.clients, client]
    }));
    setModal(null);
    setNotice("Cliente salvo.");
  }

  function changeStatus(id, status) {
    updateWorkspace((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === id ? { ...project, status } : project
      )
    }));
    setNotice("Etapa atualizada.");
  }

  function togglePayment(id) {
    updateWorkspace((current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === id ? { ...project, paid: !project.paid } : project
      )
    }));
    setNotice("Recebimento atualizado.");
  }

  function newProject() {
    if (!clients.length) {
      setNotice("Cadastre um cliente antes de criar um projeto.");
      setModal({ type: "client" });
      return;
    }
    setModal({ type: "project" });
  }

  function deleteProject(id) {
    updateWorkspace((current) => ({
      ...current,
      projects: current.projects.filter((project) => project.id !== id)
    }));
    setModal(null);
    setNotice("Projeto excluído.");
  }

  function exportCSV() {
    const rows = [
      ["Projeto", "Cliente", "Serviço", "Etapa", "Prazo", "Valor BRL", "Recebimento"],
      ...filtered.map((project) => [
        project.name,
        clientFor(project)?.name || "",
        project.category,
        statuses.find((status) => status.id === project.status).label,
        project.due,
        project.value.toFixed(2),
        project.paid ? "Recebido" : "Pendente"
      ])
    ];

    // Evita interpretar conteúdo de células como fórmulas.
    const cell = (value) => {
      const text = String(value);
      const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
      return `"${safe.replaceAll('"', '""')}"`;
    };

    const csv = "\uFEFF" + rows.map((row) => row.map(cell).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pulso-projetos.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("CSV exportado.");
  }

  function projectCard(project) {
    const client = clientFor(project);
    const isLate = project.status !== "done" && project.due < today;

    return (
      <article className="project-card" key={project.id}>
        <div className="card-top">
          <span className="service-label">{project.category}</span>
          <button
            className="icon-button"
            aria-label={`Editar ${project.name}`}
            onClick={() => setModal({ type: "project", item: project })}
          >↗</button>
        </div>

        <h3>{project.name}</h3>
        <div className="client-inline">
          <span className={`avatar small ${client.color}`}>{initials(client.name)}</span>
          <span>{client.name}</span>
        </div>

        <div className="card-divider" />

        <div className="card-bottom">
          <span className={isLate ? "late" : ""}>
            {isLate ? "Atrasado · " : ""}{dateLabel(project.due)}
          </span>
          <strong>{money(project.value)}</strong>
        </div>

        <label className="stage-label">
          <span className="sr-only">Etapa de {project.name}</span>
          <select
            value={project.status}
            onChange={(event) => changeStatus(project.id, event.target.value)}
          >
            {statuses.map((status) => (
              <option value={status.id} key={status.id}>{status.label}</option>
            ))}
          </select>
        </label>
      </article>
    );
  }

  function projectTable(financial = false) {
    if (!filtered.length) {
      return (
        <EmptyState
          title="Nenhum projeto encontrado."
          description="Ajuste os filtros ou crie um novo projeto."
          actionLabel="Novo projeto"
          onAction={newProject}
        />
      );
    }

    return (
      <div className="table-scroll">
        <table>
          <caption className="sr-only">{financial ? "Recebimentos por projeto" : "Lista de projetos"}</caption>
          <thead>
            <tr>
              <th>Projeto / cliente</th>
              <th>{financial ? "Recebimento" : "Etapa"}</th>
              <th>Prazo</th>
              <th>Valor</th>
              <th><span className="sr-only">Ações</span></th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((project) => {
              const client = clientFor(project);
              const isLate = project.status !== "done" && project.due < today;

              return (
                <tr key={project.id}>
                  <td>
                    <div className="table-project">
                      <span className={`avatar ${client.color}`}>{initials(client.name)}</span>
                      <div>
                        <button
                          className="name-button"
                          onClick={() => setModal({ type: "project", item: project })}
                        >{project.name}</button>
                        <span className="subtext">{client.name}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    {financial ? (
                      <button
                        className={`payment-button ${project.paid ? "paid" : ""}`}
                        onClick={() => togglePayment(project.id)}
                        aria-label={`${project.name}: ${project.paid ? "marcar como pendente" : "marcar como recebido"}`}
                      >{project.paid ? "✓ Recebido" : "○ Pendente"}</button>
                    ) : <StatusBadge status={project.status} />}
                  </td>

                  <td className={isLate ? "late" : ""}>
                    {dateLabel(project.due)}
                    {isLate && <span className="subtext late">Atrasado</span>}
                  </td>
                  <td className="amount">{money(project.value)}</td>

                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-button"
                        aria-label={`Editar ${project.name}`}
                        onClick={() => setModal({ type: "project", item: project })}
                      >↗</button>
                      <button
                        className="icon-button delete"
                        aria-label={`Excluir ${project.name}`}
                        onClick={() => setModal({ type: "delete", item: project })}
                      >×</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Ir para o conteúdo</a>

      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => {
          event.preventDefault();
          navigate("overview");
        }}>
          <span className="brand-symbol" aria-hidden="true">⌁</span>
          PULSO<span className="brand-dot">●</span>
        </a>

        <div className="workspace-switch">
          <span className="workspace-avatar">FP</span>
          <div><strong>Filipe Peroba</strong><span>Creative workspace</span></div>
        </div>

        <p className="nav-label">SEU ESPAÇO</p>

        <nav aria-label="Navegação principal">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              aria-current={page === item.id ? "page" : undefined}
              onClick={() => navigate(item.id)}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "projects" && <small>{projects.length}</small>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="studio-note">
            <span aria-hidden="true">✳</span>
            <strong>Espaço para criar.</strong>
            <p>Estrutura para fazer acontecer.</p>
          </div>

          <button className="reset-button" onClick={() => setModal({ type: "reset" })}>
            ↺ Restaurar demonstração
          </button>
          <p className="demo-label">DEMO LOCAL · SEM CONTA</p>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <span className="topbar-label">INDEPENDENT BY DESIGN</span>
          <div className="topbar-right">
            <span className="local-indicator"><i /> Dados locais</span>
            <span className="user-avatar">FP</span>
          </div>
        </header>

        <main id="main" className="main-content">
          {storageWarning && <p className="warning" role="alert">{storageWarning}</p>}

          <div className="page-heading">
            <div>
              <p className="eyebrow">{titles[page][0]}</p>
              <h1>{titles[page][1]}</h1>
              <p className="page-description">
                {page === "overview"
                  ? "Um pouco de organização. Mais espaço para criar."
                  : "Projetos de exemplo. Altere os dados e explore o fluxo."}
              </p>
            </div>

            <button
              className="button primary"
              onClick={page === "clients" ? () => setModal({ type: "client" }) : newProject}
            >
              <span aria-hidden="true">+</span>
              {page === "clients" ? "Novo cliente" : "Novo projeto"}
            </button>
          </div>

          {(page === "overview" || page === "finance") && (
            <section className="stats-grid" aria-label="Indicadores">
              {[
                ["Projetos ativos", active.length, "Em criação ou aguardando início", "◫"],
                ["Recebido", money(received), "Valores marcados como recebidos", "↙"],
                ["A receber", money(pending), "Saldo pendente dos projetos", "↗"],
                ["Prazos vencidos", overdue.length, "Projetos ativos com prazo passado", "◷"]
              ].map(([label, value, description, icon], index) => (
                <article className={`stat-card ${index === 1 ? "accent" : ""}`} key={label}>
                  <div><span>{label}</span><span aria-hidden="true">{icon}</span></div>
                  <strong>{value}</strong>
                  <p>{description}</p>
                </article>
              ))}
            </section>
          )}

          {page === "overview" && (
            <>
              <div className="overview-grid">
                <section className="panel distribution">
                  <div className="panel-heading">
                    <div><p className="eyebrow">FLUXO DE TRABALHO</p><h2>Onde está sua energia?</h2></div>
                    <span className="quiet-tag">{projects.length} projetos</span>
                  </div>

                  <div className="stacked-bar" aria-hidden="true">
                    {statuses.map((status) => {
                      const count = projects.filter((project) => project.status === status.id).length;
                      return count > 0 && (
                        <span
                          key={status.id}
                          className={status.color}
                          style={{ flex: count }}
                        />
                      );
                    })}
                  </div>

                  <div className="distribution-legend">
                    {statuses.map((status) => (
                      <div key={status.id}>
                        <span><i className={status.color} />{status.label}</span>
                        <strong>{projects.filter((project) => project.status === status.id).length}</strong>
                      </div>
                    ))}
                  </div>

                  <button className="text-button" onClick={() => navigate("board")}>Abrir quadro de trabalho ↗</button>
                </section>

                <section className="focus-panel">
                  <span className="focus-symbol" aria-hidden="true">✳</span>
                  <p className="eyebrow">SEU PRÓXIMO MOVIMENTO</p>
                  <h2>{overdue.length ? "Ajuste a rota." : "Mantenha o ritmo."}</h2>
                  <p>
                    {overdue.length
                      ? `${overdue.length} projeto(s) precisam de atenção no prazo. Revise a entrega e alinhe o próximo passo.`
                      : "Seus prazos ativos estão em dia. Escolha a próxima entrega e reserve espaço para criar."}
                  </p>
                  <button className="button light" onClick={() => navigate("projects")}>Revisar projetos ↗</button>
                </section>
              </div>

              <section className="panel deadlines-panel">
                <div className="panel-heading">
                  <div><p className="eyebrow">NA SUA AGENDA</p><h2>Próximas entregas</h2></div>
                  <button className="text-button" onClick={() => navigate("projects")}>Ver todos ↗</button>
                </div>

                {upcoming.length ? upcoming.map((project) => {
                  const client = clientFor(project);
                  const isLate = project.due < today;
                  return (
                    <button
                      className="deadline-row"
                      key={project.id}
                      onClick={() => setModal({ type: "project", item: project })}
                    >
                      <span className={`avatar ${client.color}`}>{initials(client.name)}</span>
                      <span className="deadline-name"><strong>{project.name}</strong><small>{client.name}</small></span>
                      <StatusBadge status={project.status} />
                      <span className={isLate ? "late" : ""}>{dateLabel(project.due)} {isLate && "· Atrasado"}</span>
                      <span aria-hidden="true">↗</span>
                    </button>
                  );
                }) : <EmptyState title="Tudo entregue." description="Os novos projetos aparecerão aqui." />}
              </section>
            </>
          )}

          {page !== "overview" && (
            <div className="toolbar">
              <label className="search-box">
                <span aria-hidden="true">⌕</span>
                <span className="sr-only">Buscar {page === "clients" ? "clientes" : "projetos"}</span>
                <input
                  type="search"
                  placeholder={page === "clients" ? "Buscar cliente ou contato..." : "Buscar projeto, cliente ou serviço..."}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              {page !== "clients" && (
                <div className="toolbar-filters">
                  {page !== "board" && (
                    <label>
                      <span className="sr-only">Filtrar por etapa</span>
                      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                        <option value="all">Todas as etapas</option>
                        {statuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
                      </select>
                    </label>
                  )}

                  <label>
                    <span className="sr-only">Filtrar por cliente</span>
                    <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
                      <option value="all">Todos os clientes</option>
                      {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                    </select>
                  </label>

                  <button className="button secondary" onClick={exportCSV}>Exportar CSV ↗</button>
                </div>
              )}
            </div>
          )}

          {page === "projects" && (
            <section className="panel">
              <div className="panel-heading">
                <h2>Todos os projetos</h2>
                <span className="quiet-tag">{filtered.length} resultados</span>
              </div>
              {projectTable()}
            </section>
          )}

          {page === "board" && (
            <section className="board" aria-label="Quadro de projetos">
              {statuses.map((status) => {
                const column = filtered.filter((project) => project.status === status.id);
                return (
                  <section className="board-column" key={status.id} aria-label={status.label}>
                    <div className="column-heading">
                      <h2><i className={status.color} />{status.label}</h2>
                      <span>{column.length}</span>
                    </div>
                    {column.map(projectCard)}
                    {!column.length && <p className="column-empty">Nenhum projeto nesta etapa.</p>}
                  </section>
                );
              })}
            </section>
          )}

          {page === "clients" && (
            filteredClients.length ? (
              <section className="clients-grid" aria-label="Clientes">
                {filteredClients.map((client) => {
                  const related = projects.filter((project) => project.clientId === client.id);
                  const total = related.reduce((sum, project) => sum + project.value, 0);

                  return (
                    <article className="client-card" key={client.id}>
                      <div className="card-top">
                        <span className={`avatar large ${client.color}`}>{initials(client.name)}</span>
                        <button
                          className="icon-button"
                          aria-label={`Editar ${client.name}`}
                          onClick={() => setModal({ type: "client", item: client })}
                        >↗</button>
                      </div>

                      <h2>{client.name}</h2>
                      <p>{client.contact}</p>
                      <span className="client-email">{client.email}</span>

                      <div className="client-stats">
                        <div><span>Projetos</span><strong>{related.length}</strong></div>
                        <div><span>Contratado</span><strong>{money(total)}</strong></div>
                      </div>

                      <button className="text-button" onClick={() => {
                        navigate("projects");
                        setClientFilter(client.id);
                      }}>Ver projetos ↗</button>
                    </article>
                  );
                })}
              </section>
            ) : <EmptyState title="Nenhum cliente encontrado." description="Busque outro nome ou adicione um cliente." onAction={() => setModal({ type: "client" })} actionLabel="Novo cliente" />
          )}

          {page === "finance" && (
            <>
              <section className="panel financial-summary">
                <div>
                  <p className="eyebrow">CARTEIRA DE PROJETOS</p>
                  <h2>{money(contracted)} contratados</h2>
                  <p>Valores de todos os projetos, sem recorte mensal.</p>
                </div>

                <div className="financial-progress">
                  <div><span>Recebido</span><strong>{receivedPercent}%</strong></div>
                  <progress value={received} max={contracted || 1} aria-label="Proporção do valor contratado já recebido" />
                  <small>Controle demonstrativo de recebimento integral por projeto.</small>
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <h2>Recebimentos</h2>
                  <span className="quiet-tag">Clique no status para atualizar</span>
                </div>
                {projectTable(true)}
              </section>
            </>
          )}

          <footer className="workspace-footer">
            <span>PULSO — seu trabalho em movimento.</span>
            <span>Projeto de portfólio · Dados demonstrativos · BRL</span>
          </footer>
        </main>
      </div>

      <div className={`toast ${notice ? "visible" : ""}`} role="status" aria-live="polite">
        {notice}
      </div>

      {modal && (
        <Modal
          title={
            modal.type === "project" ? (modal.item ? "Editar projeto" : "Novo projeto")
              : modal.type === "client" ? (modal.item ? "Editar cliente" : "Novo cliente")
              : modal.type === "delete" ? "Excluir projeto?"
              : "Restaurar demonstração?"
          }
          onClose={() => setModal(null)}
        >
          {modal.type === "project" && (
            <ProjectForm project={modal.item} clients={clients} onSave={saveProject} onClose={() => setModal(null)} />
          )}

          {modal.type === "client" && (
            <ClientForm client={modal.item} onSave={saveClient} onClose={() => setModal(null)} />
          )}

          {modal.type === "delete" && (
            <div className="confirmation">
              <p>O projeto <strong>{modal.item.name}</strong> será removido, incluindo seu valor nos indicadores. Essa ação não pode ser desfeita.</p>
              <div className="form-actions">
                <button className="button secondary" onClick={() => setModal(null)}>Cancelar</button>
                <button className="button danger" onClick={() => deleteProject(modal.item.id)}>Excluir projeto</button>
              </div>
            </div>
          )}

          {modal.type === "reset" && (
            <div className="confirmation">
              <p>Isso substituirá seus projetos e clientes pelos exemplos iniciais. As alterações atuais serão perdidas.</p>
              <div className="form-actions">
                <button className="button secondary" onClick={() => setModal(null)}>Cancelar</button>
                <button className="button danger" onClick={() => {
                  updateWorkspace(createDemo());
                  navigate("overview");
                  setModal(null);
                  setNotice("Demonstração restaurada.");
                }}>Restaurar dados</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}