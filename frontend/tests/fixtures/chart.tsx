import React from 'react';
import { createRoot } from 'react-dom/client';
import InvestmentChart from '../../src/components/InvestmentChart';
import '../../src/style.css';
import '../../src/dark-theme.css';
import '../../src/level-colors.css';
const points = [{label:'A',value:100,contributed:100,returnPercent:0},{label:'B',value:100,contributed:100,returnPercent:0},{label:'C',value:100,contributed:100,returnPercent:0}];
createRoot(document.getElementById('root')!).render(<InvestmentChart title="Flat example" language="en" data={location.search ? points.slice(0, 1) : points} />);
