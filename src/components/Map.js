import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { dijkstra, getNodesInShortestPathOrder } from './DjikstraAlgo';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

const Map = ({ markers, setMarkers }) => {
  const [roads, setRoads] = useState([]);
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  const [movingStart, setMovingStart] = useState(false);
  const [movingEnd, setMovingEnd] = useState(false);

  const customIcon = new Icon({
    iconUrl: require('../assets/placeholder.png'),
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });

  useEffect(() => {
    const fetchRoads = async () => {
      const overpassQuery = `
        [out:json];
        (
          way["highway"](around:1000,48.8566,2.3522);
        );
        out geom;
      `;

      try {
        const response = await axios.post('https://overpass-api.de/api/interpreter', overpassQuery, {
          headers: {
            'Content-Type': 'text/plain',
          },
        });
        const roadData = response.data.elements.map((element) => {
          return {
            id: element.id,
            coordinates: element.geometry.map((coord) => [coord.lat, coord.lon]),
          };
        });
        setRoads(roadData);
        console.log('Fetched Roads:', roadData); // Log to verify fetched data
      } catch (error) {
        console.error('Error fetching roads data:', error);
      }
    };

    fetchRoads();
  }, []);

  const handleMarkerMouseDown = (markerKey) => {
    if (markers.find((marker) => marker.key === markerKey).isStart) {
      setMovingStart(true);
    } else if (markers.find((marker) => marker.key === markerKey).isFinish) {
      setMovingEnd(true);
    }
    setMouseIsPressed(true);
  };

  const handleMarkerMouseEnter = (markerKey, latlng) => {
    if (!mouseIsPressed) return;
    if (movingStart) {
      const updatedMarkers = markers.map((marker) =>
        marker.key === markerKey ? { ...marker, position: [latlng.lat, latlng.lng] } : marker
      );
      setMarkers(updatedMarkers);
    } else if (movingEnd) {
      const updatedMarkers = markers.map((marker) =>
        marker.key === markerKey ? { ...marker, position: [latlng.lat, latlng.lng] } : marker
      );
      setMarkers(updatedMarkers);
    }
  };

  const handleMarkerMouseUp = () => {
    setMouseIsPressed(false);
    setMovingStart(false);
    setMovingEnd(false);
  };

  const visualizeDijkstra = () => {
    const startNode = markers.find((marker) => marker.isStart);
    const endNode = markers.find((marker) => marker.isFinish);
    const visitedNodesInOrder = dijkstra(roads, startNode, endNode);
    const nodesInShortestPathOrder = getNodesInShortestPathOrder(endNode);
    animateDijkstra(visitedNodesInOrder, nodesInShortestPathOrder);
  };

  const animateDijkstra = (visitedNodesInOrder, nodesInShortestPathOrder) => {
    for (let i = 0; i <= visitedNodesInOrder.length; i++) {
      if (i === visitedNodesInOrder.length) {
        setTimeout(() => {
          animateShortestPath(nodesInShortestPathOrder);
        }, 10 * i);
        return;
      }
      setTimeout(() => {
        const node = visitedNodesInOrder[i];
        document.getElementById(`node-${node.lat}-${node.lon}`).className = 'node node-visited';
      }, 10 * i);
    }
  };

  const animateShortestPath = (nodesInShortestPathOrder) => {
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      setTimeout(() => {
        const node = nodesInShortestPathOrder[i];
        document.getElementById(`node-${node.lat}-${node.lon}`).className = 'node node-shortest-path';
      }, 50 * i);
    }
  };

  return (
    <div>
      <MapContainer center={[48.864716, 2.349014]} zoom={13} style={{ height: '100vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        {markers.map((marker) => (
          <Marker
            key={marker.key}
            position={marker.position}
            icon={customIcon}
            draggable={true}
            onMouseDown={() => handleMarkerMouseDown(marker.key)}
            onMouseEnter={(event) => handleMarkerMouseEnter(marker.key, event.latlng)}
            onMouseUp={handleMarkerMouseUp}
          >
            <Popup>{marker.popup}</Popup>
          </Marker>
        ))}
      </MapContainer>
      <button onClick={visualizeDijkstra}>Visualize Dijkstra</button>
    </div>
  );
};

export default Map;
