import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [videos, setVideos] = useState([]);
  const [files, setFiles] = useState([]);
  const [fileProgress, setFileProgress] = useState({});
  const [removedIds, setRemovedIds] = useState(() => {
    const stored = localStorage.getItem('removedVideoIds');
    return stored ? JSON.parse(stored) : [];
  });



const fetchVideos = async () => {
  try {
    const res = await axios.get('https://my-backend-snq5.onrender.com/videos');
    setVideos(res.data);
  } catch (err) {
    console.error('❌ Error fetching videos:', err?.response?.data || err?.message || err);
    alert("Failed to fetch videos from backend. Check your backend or Render logs.");
  }
};

  useEffect(() => {
    fetchVideos();
    const interval = setInterval(fetchVideos, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpload = async () => {
    for (const file of files) {
      await uploadSingleFile(file);
    }
    setFiles([]);
    setTimeout(fetchVideos, 1000);
  };

  const uploadSingleFile = async (file) => {
  const formData = new FormData();
  formData.append('videos', file);

  let progress = 0;
  setFileProgress((prev) => ({ ...prev, [file.name]: progress }));

  return new Promise((resolve) => {
    const interval = setInterval(() => {
      progress += 2;
      if (progress > 98) progress = 98;
      setFileProgress((prev) => ({ ...prev, [file.name]: progress }));
    }, 100);

    axios
      .post('https://my-backend-snq5.onrender.com/upload', formData)
      .then(() => {
        clearInterval(interval);
        setFileProgress((prev) => ({ ...prev, [file.name]: 100 }));
        setTimeout(() => {
          setFileProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
          resolve();
        }, 1000);
      })
      .catch((err) => {
        clearInterval(interval);
        console.error("❌ Upload failed:", err?.response?.data || err?.message || err);
        alert("Upload failed. Check backend console or video format.");
        setFileProgress((prev) => ({ ...prev, [file.name]: 0 }));
        resolve();
      });
  });
};

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const removeFile = (indexToRemove) => {
    setFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleDeleteVideo = (videoId) => {
    setRemovedIds((prev) => {
      const updated = [...prev, videoId];
      localStorage.setItem('removedVideoIds', JSON.stringify(updated));
      return updated;
    });
  };

  const visibleVideos = videos.filter((v) => !removedIds.includes(v._id));
  const processingVideos = visibleVideos.filter((v) => v.status === 'processing');
  const completed = visibleVideos.filter((v) => v.status === 'completed');
  const failed = visibleVideos.filter((v) => v.status === 'failed');
  const queued = visibleVideos.filter((v) => v.status === 'queued');
  const pending = visibleVideos.filter((v) => !v.status);


  return (
    <div className="container">
      <h2>🎞️ Video Converter</h2>

      <div className="upload-section">
        <input type="file" multiple accept="video/*" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={files.length === 0}>Upload</button>

        {files.length > 0 && (
          <div className="pending-upload">
            <h4>Files to Upload:</h4>
            <ul className="file-list">
              {files.map((file, index) => (
                <li key={index} className="file-item">
                  <span>{file.name}</span>
                  <div className="progress-container small">
                    <div
                      className={`progress-bar ${fileProgress[file.name] === undefined ? 'indeterminate' : ''}`}
                      style={{ width: `${fileProgress[file.name] || 0}%` }}>
                      {fileProgress[file.name] !== undefined && (
                        <span className="progress-label">{fileProgress[file.name]}%</span>
                      )}
                    </div>
                  </div>
                  <button className="remove-btn" onClick={() => removeFile(index)}>🗑️</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <VideoSection title="Pending Files" videos={pending} labelOverride={() => 'Pending'} />
<VideoSection title="Processing Queue" videos={processingVideos} labelOverride={() => 'In Progress'} />
<VideoSection title="Queued Files" videos={queued} labelOverride={() => 'In Queue'} />
<VideoSection title="Completed" videos={completed} labelOverride={() => 'Done'} onHide={handleDeleteVideo} />
<VideoSection title="Failed" videos={failed} onHide={handleDeleteVideo} />

    </div>
  );
}

const VideoSection = ({ title, videos, labelOverride, onHide }) => {
  if (!videos.length) return null;
  return (
    <div className="section">
      <h3 className="section-title">{title}</h3>
      <ul className="video-list">
        {videos.map((video) => (
          <li key={video._id} className="video-item">
            <span className="filename">{video.filename}</span>
            <div className="actions">
              <span className={`status ${typeof labelOverride === 'function' ? labelOverride(video).toLowerCase().replace(/\s/g, '-') : video.status}`}>
                {typeof labelOverride === 'function' ? labelOverride(video) : labelOverride || video.status}
              </span>
              {video.status === 'completed' && (
                <a
                  href={`https://my-backend-snq5.onrender.com/${video.outputPath}`}
                  download
                  className="download-link"
                >Download</a>
              )}
              {onHide && (
                <button className="remove-btn" title="Hide video" onClick={() => onHide(video._id)}>🗑️</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
