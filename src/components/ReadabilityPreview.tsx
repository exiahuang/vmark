import React, { useState, useEffect } from 'react';

interface ReadabilityPreviewProps {
  content: string;
}

const ReadabilityPreview: React.FC<ReadabilityPreviewProps> = ({ content }) => {
  const [article, setArticle] = useState<{ title: string; content: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const extractArticle = async () => {
      try {
        const { Readability } = await import('@mozilla/readability');
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        
        const reader = new Readability(doc);
        const articleData = reader.parse();
        
        if (articleData) {
          setArticle({
            title: articleData.title || '',
            content: articleData.content || ''
          });
        } else {
          setError('Could not extract article content');
        }
      } catch (err) {
        console.log('Readability error:', err);
        setError('Failed to extract article');
      }
    };

    if (content) {
      extractArticle();
    }
  }, [content]);

  if (error) {
    return (
      <div className="file-preview-readability-error">
        <div className="file-preview-error-icon">⚠️</div>
        <div className="file-preview-error-title">Readability Failed</div>
        <div className="file-preview-error-text">{error}</div>
        <p>Showing raw content instead:</p>
        <pre className="file-preview-text">{content}</pre>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="file-preview-loading">
        <div className="file-preview-spinner" />
        <span>Extracting article...</span>
      </div>
    );
  }

  return (
    <div className="file-preview-readability">
      <h1 className="file-preview-readability-title">{article.title}</h1>
      <div 
        className="file-preview-readability-content"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </div>
  );
};

export default ReadabilityPreview;
