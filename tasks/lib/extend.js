// https://gist.github.com/NV/1396086#file-clone_object_with_circular_references-js
// Clone an Object with all its circular references. Take that jQuery.extend!

// function cloneObject(object) {
//     return extendObject({}, object);
// }
 
function extendObject(base, object) {
    var visited = [object];
 
    // http://en.wikipedia.org/wiki/Adjacency_list_model
    var set = [{value: base}];
 
    _extend(base, object);
    return base;
 
    function _extend(base, object) {
        for (var key in object) {
            var value = object[key];
            if (typeof value === 'object') {
                var index = visited.indexOf(value);
                if (index === -1) {
                    visited.push(value);
                    var newBase = base[key] = {};
                    set.push({up: base, value: newBase});
                    _extend(newBase, value);
                } else {
                    base[key] = set[index].value;
                }
            } else {
                base[key] = value;
            }
        }
    }
}

module.exports = extendObject