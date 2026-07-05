import type { LinkCategory, LinkItem } from '@/types';
import MagneticCard from '@/components/ui/MagneticCard';
import MetaBadge from '@/components/ui/MetaBadge';

function getLinkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function LinkCard({ item }: { item: LinkItem }) {
  return (
    <MagneticCard
      as="li"
      className="links-directory__item"
      strength={2}
      spotlightSize={260}
    >
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="links-directory__card"
      >
        <span className="links-directory__host">{getLinkHost(item.url)}</span>
        <strong className="links-directory__title">{item.title}</strong>
        <span className="links-directory__desc">{item.description}</span>
        {item.tags && item.tags.length > 0 ? (
          <span className="links-directory__tags" aria-label={`${item.title} tags`}>
            {item.tags.map((tag) => (
              <MetaBadge key={tag} className="links-directory__tag">
                {tag}
              </MetaBadge>
            ))}
          </span>
        ) : null}
      </a>
    </MagneticCard>
  );
}

export function LinksDirectory({ categories }: { categories: LinkCategory[] }) {
  const totalLinks = categories.reduce((sum, category) => sum + category.items.length, 0);

  return (
    <div className="links-directory">
      <div className="links-directory__summary" aria-label="收藏概览">
        <div className="links-directory__metric">
          <span>Collections</span>
          <strong>{categories.length}</strong>
          <small>分类</small>
        </div>
        <div className="links-directory__metric">
          <span>Links</span>
          <strong>{totalLinks}</strong>
          <small>站点</small>
        </div>
        <nav className="links-directory__nav" aria-label="链接分类">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className="links-directory__nav-link"
              aria-label={`${category.title} ${category.items.length} 个`}
            >
              <span>{category.title}</span>
              <small>{category.items.length} 个</small>
            </a>
          ))}
        </nav>
      </div>

      <div className="links-directory__sections">
        {categories.map((category) => (
          <section
            key={category.id}
            id={category.id}
            className="links-directory__category"
          >
            <div className="links-directory__category-head">
              <div>
                <MetaBadge className="links-directory__count">
                  {category.items.length} 个站点
                </MetaBadge>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
              </div>
            </div>
            <ul className="links-directory__grid" aria-label={`${category.title}链接`}>
              {category.items.map((item) => (
                <LinkCard key={item.url} item={item} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
