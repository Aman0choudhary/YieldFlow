interface SectionHeaderProps {
  index: string;
  eyebrow: string;
  thesis: string;
  paragraph?: string;
  style?: React.CSSProperties;
}

export function SectionHeader({
  index,
  eyebrow,
  thesis,
  paragraph,
  style
}: SectionHeaderProps) {
  return (
    <div className="section-header-block" style={style}>
      <div className="section-meta-row">
        <span className="section-index slide-up">{index}</span>
        <div className="section-title-wrap">
          <span className="label slide-up" style={{ animationDelay: '0.1s', color: 'var(--grey-300)' }}>
            {eyebrow}
          </span>
          <h2 className="section-thesis slide-up" style={{ animationDelay: '0.2s', marginTop: 'var(--spacer-8)' }}>
            {thesis}
          </h2>
          {paragraph && (
            <p className="large slide-up" style={{ animationDelay: '0.3s', marginTop: 'var(--spacer-12)', color: 'var(--grey-300)', maxWidth: '760px' }}>
              {paragraph}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
