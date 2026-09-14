import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown, X } from "lucide-react";

export default function ProjectSelector({ projects, selected, onSelect }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selectorRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return projects.slice(0, 15);
    }

    return projects
      .filter((project) =>
        [
          project.project_code,
          project.district,
          project.state,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(q)
          )
      )
      .slice(0, 25);
  }, [projects, query]);

  const handleSelect = (project) => {
    onSelect(project);
    setQuery("");
    setOpen(false);
  };

  const handleChevronClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen((current) => !current);
  };

  const handleClear = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setQuery("");
    setOpen(true);
  };

  return (
    <div className="project-selector" ref={selectorRef}>

      <div className="selector-label">
        Find a project
      </div>

      <div
        className={`selector-box ${
          open ? "selector-box-open" : ""
        }`}
      >
        <Search
          className="selector-search-icon"
          size={18}
        />

        <input
          type="text"
          value={query}
          placeholder={
            selected
              ? selected.project_code
              : "Search project code, district or state..."
          }
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
        />

        {query ? (
          <button
            type="button"
            className="selector-icon-button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X size={17} />
          </button>
        ) : (
          <button
            type="button"
            className="selector-icon-button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleChevronClick}
            aria-label={open ? "Close project list" : "Open project list"}
          >
            <ChevronDown
              size={18}
              className={open ? "selector-chevron-open" : ""}
            />
          </button>
        )}
      </div>

      {open && (
        <div className="selector-results">

          <div className="selector-results-header">
            {query
              ? `Search results for "${query}"`
              : "Recent projects"}
          </div>

          <div className="selector-results-list">

            {filteredProjects.length === 0 ? (
              <div className="selector-empty">
                No matching projects found.
              </div>
            ) : (
              filteredProjects.map((project) => {

                const risk = String(
                  project.risk_category || "Unscored"
                ).toLowerCase();

                return (
                  <button
                    key={project.id}
                    type="button"
                    className={`selector-result ${
                      selected?.id === project.id
                        ? "selector-result-selected"
                        : ""
                    }`}
                    onClick={() => handleSelect(project)}
                  >
                    <div className="selector-project-info">
                      <strong>
                        {project.project_code}
                      </strong>

                      <span>
                        {project.district},{" "}
                        {project.state}
                      </span>
                    </div>

                    <span
                      className={`selector-result-risk risk-${risk}`}
                    >
                      {project.risk_category || "Unscored"}
                    </span>
                  </button>
                );
              })
            )}

          </div>
        </div>
      )}
    </div>
  );
}