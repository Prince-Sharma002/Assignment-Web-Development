import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import "../styles/custom-paginator.css"; 
import logo from "../assets/logo.png"

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface ApiResponse {
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
    next_url: string | null;
  };
  data: Artwork[];
}

const ArtworkDataTable: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
  const [globalSelectedIds, setGlobalSelectedIds] = useState<Set<number>>(new Set());
  const [allArtworks, setAllArtworks] = useState<Artwork[]>([]);
  const [selectRowsCount, setSelectRowsCount] = useState<number>(0);
  const overlayRef = useRef<OverlayPanel>(null);
  const rows = 12;

  const fetchArtworks = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}`);
      const data = await response.json();
      
      setArtworks(data.data);
      setTotalRecords(data.pagination.total);
      setCurrentPage(data.pagination.current_page);
    } catch (error) {
      console.error('Failed to fetch artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks(1);
  }, []);

  useEffect(() => {
    const currentPageSelected = artworks.filter(artwork => globalSelectedIds.has(artwork.id));
    setSelectedArtworks(currentPageSelected);
  }, [artworks, globalSelectedIds]);


  const handlePageChange = (event: any) => {
    const newPage = event.page + 1;
    fetchArtworks(newPage);
  };

  const openOverlay = (event: any) => {
    if( overlayRef.current != null )
      overlayRef.current.toggle(event);
  };

  const selectNumberOfRows = async (count: number) => {
    if (count <= 0) return;
    
    setLoading(true);
    const newSelectedIds = new Set<number>();
    const selectedArtworksList: Artwork[] = [];
    
    let currentPageNum = 1;
    let selectedCount = 0;
    
    while (selectedCount < count) {
      try {
        const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${currentPageNum}`);
        const data = await response.json();
        
        for (const artwork of data.data) {
          if (selectedCount >= count) break;
          newSelectedIds.add(artwork.id);
          selectedArtworksList.push(artwork);
          selectedCount++;
        }
        
        currentPageNum++;
        if (currentPageNum > data.pagination.total_pages) break;
      } catch (error) {
        console.error('Error fetching artworks for selection:', error);
        break;
      }
    }
    
    setGlobalSelectedIds(newSelectedIds);
    setAllArtworks(prev => {
      const newAll = [...prev];
      selectedArtworksList.forEach(artwork => {
        if (!newAll.find(a => a.id === artwork.id)) {
          newAll.push(artwork);
        }
      });
      return newAll;
    });
    
    setLoading(false);
  };

  const renderTitle = (artwork: Artwork) => {
    return artwork.title || 'Untitled';
  };

  const renderOrigin = (artwork: Artwork) => {
    return artwork.place_of_origin || '-';
  };

  const renderArtist = (artwork: Artwork) => {
    return artwork.artist_display || 'Unknown';
  };

  const renderInscriptions = (artwork: Artwork) => {
    return (
      <span title={artwork.inscriptions}>
        {artwork.inscriptions ? (artwork.inscriptions.length > 30 ? artwork.inscriptions.substring(0, 30) + '...' : artwork.inscriptions) : '-'}
      </span>
    );
  };

  const renderDateRange = (artwork: Artwork) => {
    if (artwork.date_start && artwork.date_end) {
      if (artwork.date_start === artwork.date_end) {
        return <span>{artwork.date_start}</span>;
      }
      return <span>{artwork.date_start} - {artwork.date_end}</span>;
    }
    return <span className="text-gray-400">Unknown</span>;
  };

  const onSelectionChange = (e: any) => {
    const selected = e.value || [];
    const newSelectedIds = new Set(globalSelectedIds);
    
    artworks.forEach(artwork => {
      newSelectedIds.delete(artwork.id);
    });
    
    selected.forEach((artwork: Artwork) => {
      newSelectedIds.add(artwork.id);
    });
    
    setGlobalSelectedIds(newSelectedIds);
    setSelectedArtworks(selected);
  };

  const isRowSelectable = (data: Artwork) => {
    return true; 
  };

  const onRowSelect = (e: any) => {
    const artwork = e.data;
    const newSelectedIds = new Set(globalSelectedIds);
    newSelectedIds.add(artwork.id);
    setGlobalSelectedIds(newSelectedIds);
  };

  const onRowUnselect = (e: any) => {
    const artwork = e.data;
    const newSelectedIds = new Set(globalSelectedIds);
    newSelectedIds.delete(artwork.id);
    setGlobalSelectedIds(newSelectedIds);
  };

  const onSelectAllChange = (e: any) => {
    const newSelectedIds = new Set(globalSelectedIds);
    
    if (e.checked) {
      
      artworks.forEach(artwork => {
        newSelectedIds.add(artwork.id);
      });
    } else {
      artworks.forEach(artwork => {
        newSelectedIds.delete(artwork.id);
      });
    }
    
    setGlobalSelectedIds(newSelectedIds);
    
    const currentPageSelected = artworks.filter(artwork => newSelectedIds.has(artwork.id));
    setSelectedArtworks(currentPageSelected);
  };

  return (
    <div className="p-4 max-w-full">
      <div className="bg-gray-300 border border-gray-200 p-4">
        <div className="mb-4">
          <h2 className="text-2xl mb-2 text-orange-600 font-light flex items-center ">
            <img src={logo} alt="Logo" className="w-10 h-10 object-contain ml-4" />
            <span>
              GrowMeOrganic <span className="text-blue-400">DataTable</span>
            </span>
          </h2>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <span>Selected: {globalSelectedIds.size}</span>
              <button 
                onClick={openOverlay}
                className="px-2 py-1 bg-orange-600 text-white text-lg  border-2 border-black  hover:bg-orange-500 hover:border-black"
              >
                Options ↓
              </button>
            </div>
            <div
              className='p-4 bg-orange-600 text-white rounded-lg border-2 border-black'
            >
              Total: {totalRecords.toLocaleString()} items (Page {currentPage})
            </div>
          </div>
        </div>

        <DataTable 
          value={artworks} 
          loading={loading}
          emptyMessage="No data available"
          selection={selectedArtworks}
          onSelectionChange={onSelectionChange}
          onRowSelect={onRowSelect}
          onRowUnselect={onRowUnselect}
          onSelectAllChange={onSelectAllChange}
          selectionMode="multiple"
          dataKey="id"
          metaKeySelection={false}
        >
          <Column 
            selectionMode="multiple" 
            headerStyle={{width: '50px', textAlign: 'center', background: '#f3f4f6'}}
            bodyStyle={{width: '50px', textAlign: 'center', padding: '8px'}}
          />
          <Column 
            field="title" 
            header="Title" 
            body={renderTitle}
            sortable
          />
          <Column 
            field="place_of_origin" 
            header="Origin" 
            body={renderOrigin}
            sortable
          />
          <Column 
            field="artist_display" 
            header="Artist" 
            body={renderArtist}
            sortable
          />
          <Column 
            field="inscriptions" 
            header="Inscriptions" 
            body={renderInscriptions}
          />
          <Column 
            header="Start Date" 
            field="date_start"
            sortable
          />
          <Column 
            header="End Date" 
            field="date_end"
            sortable
          />
        </DataTable>

        </div>
        
        <div className="pagination-footer">
          <Paginator
            first={(currentPage - 1) * rows}
            rows={rows}
            totalRecords={totalRecords}
            onPageChange={handlePageChange}
            className='custom-paginator mt-2'
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
          />
          <div className="pagination-info text-lg pt-2">
            Showing  <span className='text-orange-600 font-bold'> {((currentPage - 1) * rows) + 1}-{Math.min(currentPage * rows, totalRecords)} </span>  of <span className='text-blue-600 font-bold'> {totalRecords.toLocaleString()} </span> entries
          </div>
        </div>
        
        <OverlayPanel ref={overlayRef} className="w-72">
          <div className="p-3">
            <div className="mb-3">
              <div className="text-sm mb-2">Selected: {globalSelectedIds.size} items</div>
            </div>
            
            <div className="mb-3">
              <label className="text-sm text-gray-600 mb-1 block ">Select number of rows:</label>
              <div className="flex flex-col gap-2">
                <InputNumber 
                  value={selectRowsCount}
                  onValueChange={(e) => setSelectRowsCount(e.value || 0)}
                  min={0}
                  max={totalRecords}
                  placeholder="Count"
                  className="border-2 p-2"
                
                />
                <Button 
                  className='bg-[#10b981] text-white border-black border-2 hover:border-black hover:opacity-90'
                  onClick={() => selectNumberOfRows(selectRowsCount)}
                  label="Go"
                  size="small"
                  disabled={!selectRowsCount || selectRowsCount <= 0}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mb-3">
              <Button 
               className='bg-orange-600 border-2 border-black text-white hover:bg-orange-500 hover:border-black'
                onClick={() => {
                  const newSelectedIds = new Set(globalSelectedIds);
                  const newSelectedArtworks = [...selectedArtworks];
                  
                  artworks.forEach(artwork => {
                    newSelectedIds.add(artwork.id);
                    if (!newSelectedArtworks.find(a => a.id === artwork.id)) {
                      newSelectedArtworks.push(artwork);
                    }
                  });
                  
                  setGlobalSelectedIds(newSelectedIds);
                  setSelectedArtworks(newSelectedArtworks);
                }}
                label="Select Page"
                size="small"
              />
              
              <Button 
              className='bg-orange-600 border-2 border-black text-white hover:bg-orange-500 hover:border-black'
                onClick={() => {
                  const newSelectedIds = new Set(globalSelectedIds);
                  const newSelectedArtworks = [...selectedArtworks];
                  
                  artworks.forEach(artwork => {
                    newSelectedIds.delete(artwork.id);
                    const index = newSelectedArtworks.findIndex(a => a.id === artwork.id);
                    if (index > -1) {
                      newSelectedArtworks.splice(index, 1);
                    }
                  });
                  
                  setGlobalSelectedIds(newSelectedIds);
                  setSelectedArtworks(newSelectedArtworks);
                }}
                label="Clear Page"
                size="small"
              />
            </div>
            
            <Button 
              onClick={() => {
                setGlobalSelectedIds(new Set());
                setSelectedArtworks([]);
              }}
              label="Clear All"
              size="small"
              className="w-full bg-red-600 hover:border-black border-black hover:bg-red-500 text-white mb-2 "
            />
            
            <Button 
              onClick={() => {
                console.log('Selected IDs:', Array.from(globalSelectedIds));
                overlayRef.current?.hide();
              }}
              label="Done"
              size="small"
              className="w-full bg-blue-500 text-white mb-2 hover:border-black border-black hover:bg-blue-400"
            />
          </div>
        </OverlayPanel>
      </div>
    
  );
};

export default ArtworkDataTable;
