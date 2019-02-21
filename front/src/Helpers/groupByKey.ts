export const groupByKey = ( array:any[] , f:(o:any)=>(number|string)[] )=>{
  var groups = {};
  array.forEach( ( o )=>{
    var group = JSON.stringify( f(o) );
    groups[group] = groups[group] || [];
    groups[group].push( o );  
  });
  return Object.keys(groups)
  .map( ( groupKey )=>{
    return groups[groupKey]; 
  })
}