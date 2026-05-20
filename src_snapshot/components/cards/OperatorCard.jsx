import React from 'react';
import { motion } from 'framer-motion';
import './OperatorCard.css';

export default function OperatorCard({ operator }) {
  const isKesh = operator.id === 'HYP-OP-002';
  const cardClass = isKesh ? 'op-card kesh-card' : 'op-card';

  return (
    <motion.div 
      className={cardClass}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="card-inner">
        <div className="card-topbar">
          <div className="card-stars">{operator.stars || "★ ★ ★ ★ ★"}</div>
          <div className="card-attr" title={operator.attrTitle || "OPERATIONS"}>{operator.attr || "K"}</div>
        </div>
        <div className="card-name">{operator.name}</div>
        
        <div className="card-art" style={{
            background: operator.artBackground || "linear-gradient(135deg,#0a1628 0%,#1a2744 50%,#0d1f3c 100%)",
            display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          {operator.image ? (
            <img src={operator.image} alt={operator.name} />
          ) : (
            <div style={{ fontFamily: "var(--font-display)", fontSize: "96px", fontWeight: "900", color: "rgba(138,180,248,0.12)", letterSpacing: "-0.02em", userSelect: "none" }}>
              {operator.attr || "K"}
            </div>
          )}
          <div className="card-art-overlay"></div>
        </div>
        
        <div className="card-typeline">
          <span className="card-type-ornament">◈</span>
          <span>{operator.typeLine}</span>
          <span className="card-type-ornament">◈</span>
        </div>
        
        <div className="card-textbox">
          <p className="card-effect">{operator.description}</p>
          {operator.focuses && (
            <div className="card-focuses">
              {operator.focuses.map((focus, idx) => (
                <div key={idx} className="card-focus"><span className="focus-diamond">◆</span>{focus}</div>
              ))}
            </div>
          )}
          <div className="card-flavor">{operator.flavor}</div>
        </div>
        
        <div className="card-stats">
          {operator.stats && operator.stats.map((stat, idx) => (
            <div key={idx} className="card-stat">{stat.label}<span>{stat.value}</span></div>
          ))}
        </div>
        <div className="card-serial">{operator.serial}</div>
      </div>
    </motion.div>
  );
}
