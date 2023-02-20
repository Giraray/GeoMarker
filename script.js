//map setup
const iceland = [64.9631, -19.0208]

var map = L.map('map').setView([0, 0], 2);
map.doubleClickZoom.disable()

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 2,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

//set bounds
var southWest = L.latLng(-89.98155760646617, -180),
    northEast = L.latLng(89.99346179538875, 180);
var bounds = L.latLngBounds(southWest, northEast);
map.setMaxBounds(bounds);
map.on('drag', function () {
    map.panInsideBounds(bounds, { animate: false })
})

const markers = []
let newMarkerG
let addingMarker = false
let settingMarker = false
let markerClicked
let popupActive
let optionPopupG

addButton = document.getElementById('addmarker')
nameInput = document.getElementById('nameinput')
saveButton = document.getElementById('savemarker')
inputDiv = document.getElementById('inputdiv')
listDiv = document.getElementById('listdiv')

addButton.addEventListener('click', initAdd)

//Check if marker creation is initialized (clicked on map after clicking "add marker")
function initAdd() {
    if (settingMarker == false) {
        addingMarker = true

        removePopup()
    }
}

map.on('click', setMarker)

function setMarker(e) {
    if (addingMarker == true) {
        var newMarkerL = new L.marker(e.latlng).addTo(map).on('click', markerEvent)
        newMarkerG = newMarkerL

        addingMarker = false
        settingMarker = true
        inputDiv.style.display = 'block'

        removePopup()
    }
}

function resetSaveInput() {
    settingMarker = false
    inputDiv.style.display = 'none'
    nameInput.value = ''
}

saveButton.addEventListener('click', (e) => {
    if (settingMarker == true) {
        newMarkerG.options.title = nameInput.value

        markers.push(newMarkerG)

        Object.defineProperty(newMarkerG.options, 'id', {
            value: '0',
            writable: true
        })
        newId = Math.max(...markers.map(o => o.options.id)) + 1
        newMarkerG.options.id = newId

        Object.defineProperty(newMarkerG.options, 'status', {
            value: 'saved'

        })
        Object.defineProperty(newMarkerG.options, 'desc', {
            value: '',
            configurable: true,
            writable: true
        })

        resetSaveInput()
        updateCounter()
        addToList()
        newLocalMarker(newMarkerG)
    }
})

//adds a marker listing
function addToList() {
    var name = newMarkerG.options.title
    var desc = newMarkerG.options.desc
    var id = newMarkerG.options.id

    const newListingName = document.createElement('p')
    newListingName.setAttribute('style', 'margin:5px;')
    newListingName.setAttribute('class', 'listingname')
    newListingName.innerHTML = name

    const newListingDelete = document.createElement('button')
    newListingDelete.setAttribute('class', 'deletebtn')
    newListingDelete.addEventListener('click', () => {
        var deletedMarker = markers[markers.map(object => object.options.id).indexOf(id)]
        markers.splice(markers.map(object => object.options.id).indexOf(id), 1)
        newListing.parentElement.removeChild(newListing)

        //remove from localStorage
        for (var i = 0; i < localStorage.length; i++) {
            markerInfo = JSON.parse(localStorage.getItem(localStorage.key(i)))
            if (markerInfo[6] == 'marker' && markerInfo[0] == deletedMarker.options.id) {
                localStorage.removeItem('LOCAL_marker' + deletedMarker.options.id)
            }
        }
        deletedMarker.remove()
        updateCounter()
    })

    const newListingDesc = document.createElement('p')
    newListingDesc.setAttribute('style', 'margin:5px; font-size:80%')
    newListingDesc.setAttribute('class', 'listingdesc')
    if (desc != '') {
        newListingDesc.innerHTML = '"' + desc + '"'
    }

    const newListing = document.createElement('div')
    newListing.setAttribute('id', 'listing' + id)
    newListing.setAttribute('class', 'listing')
    newListing.appendChild(newListingDelete)
    newListing.appendChild(newListingName)
    newListing.appendChild(newListingDesc)

    listDiv.appendChild(newListing)

    newListing.addEventListener('click', markerEvent)
}

//god, i feel smart for this
function markerEvent(e) {

    targetMarker = ''

    //checks if user clicked marker
    if (e.sourceTarget) {
        if (e.sourceTarget.options.status == 'saved') {
            targetMarker = e.sourceTarget
            targetIndex = targetMarker.options.id
        }
    }

    //next two checks if user clicked div
    else if (!e.path[0].id && e.path[0].className != 'deletebtn') {
        selectedListing = e.path[0].parentElement
        targetIndex = selectedListing.id.substring('listing'.length)

        for (const marker of markers) {
            if (marker.options.id == targetIndex) {
                targetMarker = marker
                targetMarker
            }
        }
    }
    else if (e.path[0].className != 'deletebtn') {
        selectedListing = e.path[0]
        targetIndex = selectedListing.id.substring('listing'.length)

        for (const marker of markers) {
            if (marker.options.id == targetIndex) {
                targetMarker = marker
                targetMarker
            }
        }
    }

    if (targetMarker) {
        targetName = targetMarker.options.title
        targetLatlng = targetMarker._latlng
        targetDesc = targetMarker.options.desc
        targetListing = document.getElementById('listing' + targetMarker.options.id)

        map.setView(targetLatlng, 5)

        //popup
        if (popupActive == true) {
            removePopup()
        }

        const optionPopup = document.createElement('div')
        optionPopup.setAttribute('class', 'optionpopup')
        document.getElementById('mapbody').appendChild(optionPopup)

        const popupName = document.createElement('span')
        popupName.setAttribute('class', 'popupelement')
        popupName.innerHTML = 'Name: '

        const popupNameInput = document.createElement('input')
        popupNameInput.setAttribute('value', targetName)
        popupNameInput.setAttribute('class', 'popupelement')
        popupNameInput.addEventListener('input', () => {
            targetName = popupNameInput.value
            targetMarker.options.title = targetName
            targetListing.getElementsByClassName('listingname')[0].innerHTML = targetName

            //update localStorage name data
            for (var i = 0; i < localStorage.length; i++) {
                if (localStorage.getItem(localStorage.key(i)).includes('marker')) { //checks if variable is a marker variable
                    markerInfo = JSON.parse(localStorage.getItem(localStorage.key(i)))
                    if (markerInfo[6] == 'marker' && markerInfo[0] == targetMarker.options.id) {
                        markerInfo[1] = targetName
                        localStorage.setItem('LOCAL_marker' + targetMarker.options.id, JSON.stringify(markerInfo))
                    }
                }
            }
        })

        const popupId = document.createElement('span')
        popupId.setAttribute('class', 'popupid popupelement')
        popupId.setAttribute('title', 'ID')
        popupId.innerHTML = targetMarker.options.id

        const descText = document.createElement('span')
        descText.setAttribute('class', 'desctext popupelement')
        descText.innerHTML = 'Description:'

        const descInput = document.createElement('textarea')
        descInput.setAttribute('class', 'popupelement descinput')
        descInput.innerHTML = targetDesc
        descInput.addEventListener('input', () => {
            targetDesc = descInput.value
            targetMarker.options.desc = targetDesc
            if (targetDesc != '') {
                targetListing.getElementsByClassName('listingdesc')[0].innerHTML = targetDesc
            }
            else targetListing.getElementsByClassName('listingdesc')[0].innerHTML = ''

            //update localStorage desc data
            for (var i = 0; i < localStorage.length; i++) {
                if (localStorage.getItem(localStorage.key(i)).includes('marker')) { //checks if variable is a marker variable
                    markerInfo = JSON.parse(localStorage.getItem(localStorage.key(i)))
                    if (markerInfo[6] == 'marker' && markerInfo[0] == targetMarker.options.id) {
                        markerInfo[2] = targetDesc
                        localStorage.setItem('LOCAL_marker' + targetMarker.options.id, JSON.stringify(markerInfo))
                    }
                }
            }
        })

        const xbtn = document.createElement('btn')
        xbtn.setAttribute('class', 'xbtn popupelement')
        xbtn.addEventListener('click', (e) => {
            removePopup()
        })

        optionPopup.appendChild(popupName)
        optionPopup.appendChild(popupNameInput)
        optionPopup.appendChild(xbtn)
        optionPopup.appendChild(popupId)
        optionPopup.appendChild(descInput)
        optionPopup.appendChild(descText)

        optionPopupG = optionPopup
        popupActive = true
    }
}

const counter = document.getElementById('counter')

function updateCounter() {
    totalMarkers = markers.length
    counter.innerHTML = totalMarkers
    if (totalMarkers == 1) { counter.title = totalMarkers + ' marker' }
    else { counter.title = totalMarkers + ' markers' }
}

function removePopup() {
    if (popupActive == true) {
        optionPopupG.parentElement.removeChild(optionPopupG)
        popupActive = false
    }
}

function newLocalMarker(newMarkerG) {
    var markerInfo = []
    markerInfo[0] = newMarkerG.options.id
    markerInfo[1] = newMarkerG.options.title
    markerInfo[2] = newMarkerG.options.desc
    markerInfo[3] = newMarkerG.options.status
    markerInfo[4] = newMarkerG._latlng.lat
    markerInfo[5] = newMarkerG._latlng.lng
    markerInfo[6] = 'marker'
    localStorage.setItem('LOCAL_marker' + newMarkerG.options.id, JSON.stringify(markerInfo))
}

function loadMarkers() {
    for (var i = 0; i < localStorage.length; i++) {
        if (localStorage.getItem(localStorage.key(i)).includes('marker')) { //checks if variable is a marker variable
            markerInfo = JSON.parse(localStorage.getItem(localStorage.key(i)))
            if (markerInfo[6] == 'marker') { //double checking previous check.... for some reason
                var newlatlng = [markerInfo[4], markerInfo[5]]
                var newMarkerL = new L.marker(newlatlng).addTo(map).on('click', markerEvent)

                newMarkerL.options.title = markerInfo[1]

                Object.defineProperty(newMarkerL.options, 'id', {
                    value: markerInfo[0],
                    writable: true
                })

                Object.defineProperty(newMarkerL.options, 'status', {
                    value: markerInfo[3]

                })
                Object.defineProperty(newMarkerL.options, 'desc', {
                    value: markerInfo[2],
                    configurable: true,
                    writable: true
                })

                newMarkerG = newMarkerL
                markers.push(newMarkerG)

                updateCounter()
                addToList()
            }
        }
    }
}

loadMarkers()
