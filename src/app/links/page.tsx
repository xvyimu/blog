import { linkCategories } from '@/lib/links';

export default function LinksPage() {
  return (
    <section className="section">
      <div className="section__inner">
        <div className="section__head">
          <div>
            <span className="section__eyebrow">Links</span>
            <h2 className="section__title">导航</h2>
            <p className="section__subtitle">
              精选技术文档、VPS 官网、开发工具和趣味小站
            </p>
          </div>
        </div>

        <div className="mx-auto space-y-16" style={{ maxWidth: 960 }}>
          {linkCategories.map((category) => (
            <section key={category.id}>
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-[var(--text)]">
                  {category.title}
                </h3>
                <p className="mt-2 text-[var(--text-soft)]">
                  {category.description}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item) => (
                  <a
                    key={item.title}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--brand)] hover:shadow-[var(--shadow-md)]"
                  >
                    <h4 className="font-medium text-[var(--text)] transition-colors group-hover:text-[var(--brand)]">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">
                      {item.description}
                    </p>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
