
function Dashboard({ projects }) {
  const categories = [
    'Residential',
    'Commercial',
    'Institutional',
    'Interior Design',
    'Landscape'
  ];

  const categoryData = categories.map(category => ({
    name: category,
    count: projects.filter(project => project.category === category).length
  }));

  const total = projects.length;
  const representedCategories = categoryData.filter(item => item.count > 0).length;
  const largestCategory = [...categoryData].sort(
    (a, b) => b.count - a.count
  )[0];

  const chartData = categoryData.filter(item => item.count > 0);
  const chartColors = ['#c6a15e', '#a88b5a', '#8b7654', '#71634d', '#554b3b'];

  return (
    <section className="executive-dashboard" id="dashboard">
      <div className="dashboard-topline">
        <div>
          <p className="eyebrow">MANAGEMENT INTELLIGENCE</p>
          <h2>Executive <span>Dashboard</span></h2>
          <p className="dashboard-description">
            A live overview of your architectural portfolio.
          </p>
        </div>

        <div className="dashboard-live">
          <span className="live-dot"></span>
          DATABASE CONNECTED
        </div>
      </div>

      <div className="executive-stats">
        <article className="executive-stat main-stat">
          <div className="stat-heading">
            <span>PORTFOLIO SIZE</span>
            <span className="stat-symbol">◈</span>
          </div>
          <strong>{String(total).padStart(2, '0')}</strong>
          <p>Total registered projects</p>
          <div className="stat-bottom-line"></div>
        </article>

        <article className="executive-stat">
          <div className="stat-heading">
            <span>CATEGORIES</span>
            <span className="stat-symbol">▦</span>
          </div>
          <strong>{String(representedCategories).padStart(2, '0')}</strong>
          <p>Categories represented</p>
        </article>

        <article className="executive-stat">
          <div className="stat-heading">
            <span>LEADING CATEGORY</span>
            <span className="stat-symbol">✧</span>
          </div>
          <strong className="leading-category">
            {total && largestCategory?.count ? largestCategory.name : '—'}
          </strong>
          <p>
            {total && largestCategory?.count
              ? `${largestCategory.count} project(s)`
              : 'Add projects to see insights'}
          </p>
        </article>
      </div>

      <div className="dashboard-insights">
        <article className="insight-panel portfolio-chart-panel">
          <div className="insight-heading">
            <div>
              <p className="eyebrow">PORTFOLIO ANALYSIS</p>
              <h3>Project Distribution</h3>
            </div>
            <span className="insight-tag">BY CATEGORY</span>
          </div>

          {total === 0 ? (
            <div className="chart-empty">
              Your portfolio chart will appear when you add projects.
            </div>
          ) : (
            <>
              <div className="donut-area">
                <div
                  className="donut-chart"
                  style={{
                    background: `conic-gradient(${chartData.map((item) => {
                      const index = categories.indexOf(item.name);
                      return `${chartColors[index]} 0 ${(item.count / total) * 100}%`;
                    }).join(', ')})`
                  }}
                >
                  <div className="donut-center">
                    <strong>{total}</strong>
                    <span>PROJECTS</span>
                  </div>
                </div>
              </div>

              <div className="chart-legend">
                {chartData.map(item => {
                  const index = categories.indexOf(item.name);
                  const percentage = Math.round((item.count / total) * 100);

                  return (
                    <div className="legend-item" key={item.name}>
                      <span
                        className="legend-dot"
                        style={{ background: chartColors[index] }}
                      ></span>
                      <span className="legend-name">{item.name}</span>
                      <strong>{item.count}</strong>
                      <small>{percentage}%</small>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </article>

        <article className="insight-panel category-panel">
          <div className="insight-heading">
            <div>
              <p className="eyebrow">CATEGORY PERFORMANCE</p>
              <h3>Portfolio Breakdown</h3>
            </div>
            <span className="insight-tag">LIVE DATA</span>
          </div>

          <div className="category-breakdown">
            {categoryData.map((item, index) => {
              const percentage = total
                ? (item.count / total) * 100
                : 0;

              return (
                <div className="breakdown-item" key={item.name}>
                  <div className="breakdown-label">
                    <span>{item.name}</span>
                    <strong>{item.count}</strong>
                  </div>

                  <div className="breakdown-track">
                    <div
                      className="breakdown-fill"
                      style={{
                        width: `${percentage}%`,
                        background: chartColors[index]
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="category-panel-footer">
            <span>PORTFOLIO RECORDS</span>
            <strong>{String(total).padStart(2, '0')}</strong>
          </div>
        </article>
      </div>
    </section>
  );
}

export default Dashboard;
