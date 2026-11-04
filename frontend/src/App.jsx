import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import Dashboard from './Dashboard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/projects';

const architecturalImage =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 750">
    <defs>
      <linearGradient id="sky" x2="0" y2="1">
        <stop stop-color="#171b24"/>
        <stop offset=".55" stop-color="#76523e"/>
        <stop offset="1" stop-color="#d19a62"/>
      </linearGradient>
      <linearGradient id="glass" x2="1" y2="1">
        <stop stop-color="#71818a"/>
        <stop offset="1" stop-color="#10191c"/>
      </linearGradient>
    </defs>
    <rect width="1000" height="750" fill="url(#sky)"/>
    <circle cx="790" cy="160" r="85" fill="#e7bd83" opacity=".5"/>
    <path d="M0 520L1000 420V750H0Z" fill="#151a18"/>
    <path d="M120 340L650 230L920 330V590L120 650Z" fill="#49453e"/>
    <path d="M120 340L650 230L920 330L390 430Z" fill="#b4a58b"/>
    <path d="M390 430L920 330V590L390 680Z" fill="#272c2b"/>
    <path d="M425 445L880 360V550L425 635Z" fill="url(#glass)" stroke="#c6a15e" stroke-width="5"/>
    <path d="M570 418V608M720 390V580M425 535L880 450" stroke="#c6a15e" stroke-width="5"/>
    <path d="M75 330L650 210L960 315L390 435Z" fill="#202321" stroke="#c6a15e" stroke-width="5"/>
    <path d="M0 690L390 635L1000 575V750H0Z" fill="#263b3b"/>
    <path d="M0 700L390 650L1000 590" stroke="#d4ae72" stroke-width="5" fill="none"/>
    <g fill="#19251d">
      <circle cx="90" cy="380" r="95"/>
      <circle cx="965" cy="410" r="100"/>
    </g>
    <g stroke="#c6a15e" stroke-width="3" opacity=".65">
      <path d="M100 730L420 680M500 735L850 680"/>
    </g>
  </svg>
`);

const categories = [
  'Residential',
  'Commercial',
  'Institutional',
  'Interior Design',
  'Landscape'
];

function App() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Residential');
  const [imageUrl, setImageUrl] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState('');

  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const [sort, setSort] = useState('newest');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
const [favorites, setFavorites] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem('elite-favorites') || '[]');
  } catch {
    return [];
  }
});

const [showFavorites, setShowFavorites] = useState(false);
const [compareProjects, setCompareProjects] = useState([]);

const toggleCompare = (project) => {
  const id = String(project._id);

  setCompareProjects(previous => {
    if (previous.some(item => String(item._id) === id)) {
      return previous.filter(item => String(item._id) !== id);
    }

    if (previous.length >= 2) {
      setMessage('You can compare only two projects at a time.');
      return previous;
    }

    setMessage('');
    return [...previous, project];
  });
};

useEffect(() => {
  localStorage.setItem('elite-favorites', JSON.stringify(favorites));
}, [favorites]);

const toggleFavorite = (projectId) => {
  const id = String(projectId);

  setFavorites(previous =>
    previous.includes(id)
      ? previous.filter(item => item !== id)
      : [...previous, id]
  );
};

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(API);

      if (!response.ok) {
        throw new Error('Unable to connect to the project server.');
      }

      const data = await response.json();
      setProjects(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];
if (showFavorites) {
  result = result.filter(project =>
    favorites.includes(String(project._id))
  );
}

    if (search.trim()) {
      const query = search.toLowerCase().trim();

      result = result.filter(project =>
        (project.name || '').toLowerCase().includes(query) ||
        (project.category || '').toLowerCase().includes(query) ||
        (project.location || '').toLowerCase().includes(query) ||
        (project.description || '').toLowerCase().includes(query)
      );
    }

    if (filter !== 'All') {
      result = result.filter(project => project.category === filter);
    }

    if (sort === 'az') {
      result.sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
      );
    } else if (sort === 'za') {
      result.sort((a, b) =>
        (b.name || '').localeCompare(a.name || '')
      );
    }

    return result;
  }, [projects, search, filter, sort])

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    if (!name.trim()) {
      setMessage('Please enter a project name.');
      return;
    }

    try {
      setSaving(true);

      const projectData = {
        name: name.trim(),
        category,
        imageUrl: imageUrl.trim(),
        location: location.trim(),
        description: description.trim(),
        year: year.trim()
      };

      const response = await fetch(
        editId ? `${API}/${editId}` : API,
        {
          method: editId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to save project.');
      }

      resetForm();
      setMessage(data.message || 'Project saved successfully.');

      await loadProjects();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setName('');
    setCategory('Residential');
    setImageUrl('');
    setLocation('');
    setDescription('');
    setYear('');
    setEditId(null);
  }

  function editProject(project) {
    setEditId(project._id);
    setName(project.name || '');
    setCategory(project.category || 'Residential');
    setImageUrl(project.imageUrl || '');
    setLocation(project.location || '');
    setDescription(project.description || '');
    setYear(project.year || '');
    setSelectedProject(null);
    setMessage('');

    document.getElementById('management')?.scrollIntoView({
      behavior: 'smooth'
    });
  }

  function cancelEdit() {
    resetForm();
    setMessage('');
  }

  async function deleteProject(id) {
    if (!window.confirm('Delete this project permanently?')) return;

    try {
      const response = await fetch(`${API}/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to delete project.');
      }

      setSelectedProject(null);
      setMessage(data.message || 'Project deleted successfully.');

      await loadProjects();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function projectImage(project) {
    return project.imageUrl || architecturalImage;
  }

  function handleImageError(event) {
    event.currentTarget.onerror = null;
    event.currentTarget.src = architecturalImage;
  }

  const featuredProject = projects.find(
    project => project.imageUrl && project.imageUrl.trim()
  );

  return (
    <div className="website">

      {/* NAVIGATION */}
      <nav className="navbar">
        <a href="#home" className="brand">
          <span className="brand-symbol">EA</span>
          <span>
            <strong>ELITE</strong>
            <small>ARCHITECTURAL FIRM</small>
          </span>
        </a>

        <div className="nav-links">
          <a href="#home">HOME</a>
          <a href="#dashboard">DASHBOARD</a>
          <a href="#projects">PORTFOLIO</a>
          <a href="#management" className="nav-contact">
            MANAGE PROJECTS →
          </a>
        </div>
      </nav>

      {/* CINEMATIC HERO */}
      <header className="hero" id="home">

        <div className="hero-content">
          <p className="eyebrow">
            DESIGN · INNOVATION · EXCELLENCE
          </p>

          <h1>
            Architecture
            <br />
            Beyond <span>Imagination.</span>
          </h1>

          <p className="hero-description">
            We create extraordinary spaces where visionary design,
            precision engineering and timeless elegance meet.
          </p>

          <div className="hero-actions">
            <a href="#projects" className="gold-button">
              EXPLORE OUR WORK →
            </a>

            <a href="#management" className="text-link">
              MANAGE PROJECTS
            </a>
          </div>

          <div className="hero-note">
            <span>01</span>
            <p>CRAFTING THE FUTURE, ONE SPACE AT A TIME</p>
          </div>
        </div>

        <div className="hero-visual featured-hero">

          <img
            src={featuredProject?.imageUrl || architecturalImage}
            alt={
              featuredProject?.name ||
              'Modern luxury architectural villa'
            }
            onError={handleImageError}
          />

          <div className="hero-image-label">
            <span>FEATURED PROJECT · ELITE COLLECTION</span>

            <strong>
              {featuredProject?.name || 'THE ART OF LIVING'}
            </strong>

            {featuredProject?.location && (
              <small>{featuredProject.location}</small>
            )}
          </div>

          {featuredProject && (
            <button
              className="featured-view-button"
              onClick={() => setSelectedProject(featuredProject)}
            >
              EXPLORE PROJECT →
            </button>
          )}

          <span className="featured-index">
            01 / FEATURED
          </span>
        </div>
      </header>

      {/* INTRO */}
      <section className="intro">
        <p className="eyebrow">THE ELITE PHILOSOPHY</p>

        <h2>
          Spaces that inspire.
          <br />
          <span>Structures that endure.</span>
        </h2>

        <p>
          Every architectural vision deserves thoughtful execution.
          We bring creativity, functionality and refined aesthetics
          together to create meaningful spaces.
        </p>
      </section>

      {/* EXECUTIVE DASHBOARD */}
      <Dashboard projects={projects} />

      {/* PROJECT MANAGEMENT */}
      <section className="management" id="management">

        <div className="section-heading">
          <div>
            <p className="eyebrow">PROJECT CONTROL CENTER</p>
            <h2>Manage <span>Projects</span></h2>

            <p className="section-subtitle">
              Organise and maintain your architectural portfolio.
            </p>
          </div>

          <div className="project-count">
            <strong>
              {projects.length.toString().padStart(2, '0')}
            </strong>
            <small>PROJECT RECORDS</small>
          </div>
        </div>

        <div className="form-panel">

          <div className="form-title">
            <span className="form-mark">✦</span>

            <div>
              <p className="eyebrow">PROJECT INFORMATION</p>
              <h3>
                {editId ? 'EDIT PROJECT' : 'CREATE A NEW PROJECT'}
              </h3>
            </div>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="field">
              <label htmlFor="projectName">PROJECT NAME *</label>

              <input
                id="projectName"
                type="text"
                placeholder="e.g. The Aurelia Residence"
                value={name}
                onChange={event => setName(event.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="projectCategory">PROJECT CATEGORY *</label>

              <select
                id="projectCategory"
                value={category}
                onChange={event => setCategory(event.target.value)}
              >
                {categories.map(item => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="projectImage">PROJECT IMAGE URL</label>

              <input
                id="projectImage"
                type="url"
                placeholder="https://example.com/architecture.jpg"
                value={imageUrl}
                onChange={event => setImageUrl(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="projectLocation">PROJECT LOCATION</label>

              <input
                id="projectLocation"
                type="text"
                placeholder="e.g. Bengaluru, India"
                value={location}
                onChange={event => setLocation(event.target.value)}
                maxLength={150}
              />
            </div>

            <div className="field">
              <label htmlFor="projectYear">COMPLETION YEAR</label>

              <input
                id="projectYear"
                type="number"
                placeholder="e.g. 2026"
                min="1900"
                max="2100"
                value={year}
                onChange={event => setYear(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="projectDescription">
                PROJECT DESCRIPTION
              </label>

              <textarea
                id="projectDescription"
                placeholder="Describe the architectural vision, materials, design features and project highlights..."
                value={description}
                onChange={event => setDescription(event.target.value)}
                maxLength={1000}
                rows={4}
              />
            </div>

            {imageUrl && (
              <div className="image-preview">
                <p className="eyebrow">IMAGE PREVIEW</p>

                <img
                  src={imageUrl}
                  alt="Project preview"
                  onError={handleImageError}
                />
              </div>
            )}

            <div className="form-buttons">
              <button
                type="submit"
                className="gold-button"
                disabled={saving}
              >
                {saving
                  ? 'SAVING...'
                  : editId
                    ? 'UPDATE PROJECT →'
                    : 'ADD PROJECT +'}
              </button>

              {editId && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={cancelEdit}
                >
                  CANCEL
                </button>
              )}
            </div>

          </form>

          {message && (
            <div className="message" role="status">
              ✓ {message}
            </div>
          )}

        </div>
      </section>

      {/* PORTFOLIO */}
      <section className="projects" id="projects">

        <div className="section-heading">
          <div>
            <p className="eyebrow">A COLLECTION OF EXCELLENCE</p>
            <h2>Selected <span>Works</span></h2>

            <p className="section-subtitle">
              Explore the projects that define our design philosophy.
            </p>
          </div>

          <span className="portfolio-count">
            {filteredProjects.length.toString().padStart(2, '0')} PROJECTS
          </span>
        </div>

        <div className="portfolio-toolbar">
<button
  type="button"
  className={`favorite-filter ${showFavorites ? 'active' : ''}`}
  onClick={() => setShowFavorites(previous => !previous)}
>
  ♥ {showFavorites ? 'SHOW ALL PROJECTS' : `FAVOURITES (${favorites.length})`}
</button>

          <input
            className="search-box"
            type="search"
            placeholder="Search by project, location or category..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />

          <select
            className="filter-select"
            value={filter}
            onChange={event => setFilter(event.target.value)}
          >
            <option value="All">All categories</option>

            {categories.map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={sort}
            onChange={event => setSort(event.target.value)}
          >
            <option value="newest">Default order</option>
            <option value="az">Name: A to Z</option>
            <option value="za">Name: Z to A</option>
          </select>

        </div>

        {loading ? (
          <div className="empty-state">
            <h3>Loading portfolio...</h3>
            <p>Connecting to your project database.</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-state">
            <span>✦</span>
            <h3>No projects found</h3>
            <p>
              Try another search or add a new architectural project.
            </p>
          </div>
        ) : (
          <div className="project-grid">

            {filteredProjects.map((project, index) => (
              <article className="project-card" key={project._id}>

                <div className="project-image">
                  <img
                    src={projectImage(project)}
                    alt={`Architectural project ${project.name}`}
                    onError={handleImageError}
                    loading="lazy"
                  />
<button
  type="button"
  className={`favorite-heart ${
    favorites.includes(String(project._id)) ? 'is-favorite' : ''
  }`}
  onClick={() => toggleFavorite(project._id)}
  aria-label={
    favorites.includes(String(project._id))
      ? 'Remove from favourites'
      : 'Add to favourites'
  }
>
  {favorites.includes(String(project._id)) ? '♥' : '♡'}
</button>

                  <span className="project-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="image-caption">
                    ELITE / ARCHITECTURE
                  </span>
                </div>

                <div className="project-details">

                  <p className="project-category">
                    {project.category}
                  </p>

                  <h3>{project.name}</h3>

                  {project.location && (
                    <p className="project-location">
                      ◈ {project.location}
                    </p>
                  )}
<button
  type="button"
  className={`compare-button ${
    compareProjects.some(item => String(item._id) === String(project._id))
      ? 'selected'
      : ''
  }`}
  onClick={() => toggleCompare(project)}
>
  {compareProjects.some(item => String(item._id) === String(project._id))
    ? '✓ SELECTED'
    : '+ COMPARE'}
</button>

                  <div className="card-actions">

                    <button
                      onClick={() => setSelectedProject(project)}
                    >
                      VIEW DETAILS →
                    </button>

                    <button onClick={() => editProject(project)}>
                      EDIT
                    </button>

                    <button
                      className="delete-action"
                      onClick={() => deleteProject(project._id)}
                    >
                      DELETE
                    </button>

                  </div>
                </div>
              </article>
            ))}

          </div>
        )}

      </section>
{compareProjects.length > 0 && (
  <section className="comparison-panel">
    <div className="comparison-heading">
      <div>
        <p>ELITE / SIDE BY SIDE</p>
        <h2>Project <span>Comparison</span></h2>
      </div>
      <button onClick={() => setCompareProjects([])}>
        CLEAR
      </button>
    </div>

    <p>{compareProjects.length} of 2 projects selected</p>

    {compareProjects.length === 2 && (
      <div className="comparison-grid">
        {compareProjects.map(project => (
          <div className="comparison-item" key={project._id}>
            <img
              src={projectImage(project)}
              alt={project.name}
              onError={handleImageError}
            />
            <h3>{project.name}</h3>
            <p><strong>Category:</strong> {project.category}</p>
            <p><strong>Location:</strong> {project.location || 'Not specified'}</p>
            <p><strong>Year:</strong> {project.year || 'Not specified'}</p>
            <p>{project.description || 'No description available.'}</p>
            <button onClick={() => toggleCompare(project)}>
              REMOVE
            </button>
          </div>
        ))}
      </div>
    )}
  </section>
)}

      {/* PROJECT DETAILS MODAL */}
      {selectedProject && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="project-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={event => event.stopPropagation()}
          >

            <button
              className="modal-close"
              onClick={() => setSelectedProject(null)}
              aria-label="Close project details"
            >
              ×
            </button>

            <img
              src={projectImage(selectedProject)}
              alt={selectedProject.name}
              onError={handleImageError}
            />

            <p className="eyebrow">ELITE PROJECT PROFILE</p>

            <h2 id="modal-title">
              {selectedProject.name}
            </h2>

            <p className="modal-category">
              {selectedProject.category}
            </p>

            {selectedProject.location && (
              <p className="modal-info">
                <strong>LOCATION</strong>
                {selectedProject.location}
              </p>
            )}

            {selectedProject.year && (
              <p className="modal-info">
                <strong>COMPLETION YEAR</strong>
                {selectedProject.year}
              </p>
            )}

            {selectedProject.description && (
              <p className="modal-description">
                {selectedProject.description}
              </p>
            )}

            <div className="modal-actions">

              <button
                className="gold-button"
                onClick={() => editProject(selectedProject)}
              >
                EDIT PROJECT
              </button>

              <button
                className="cancel-button"
                onClick={() => setSelectedProject(null)}
              >
                CLOSE
              </button>

            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer>

        <div className="brand">
          <span className="brand-symbol">EA</span>

          <span>
            <strong>ELITE</strong>
            <small>ARCHITECTURAL FIRM</small>
          </span>
        </div>

        <p>CRAFTING SPACES. CREATING LEGACIES.</p>

        <small>© 2026 ELITE ARCHITECTURAL FIRM</small>

      </footer>

    </div>
  );
}

export default App;